'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MessageSquare, Send, X, User, Sparkles, CheckCheck,
  ShieldCheck, ImageIcon, Paperclip, Loader2, Image as LucideImage
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getStoredThreads,
  sendChatMessage,
  addIncomingReply,
  type ChatThread,
  type ChatMessage,
} from '@/lib/chat'
import { createClient } from '@/lib/supabase/client'

interface ChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  currentRole: 'brand' | 'creator' | 'user'
  currentUserName?: string
  initialThreadId?: string | null
}

export default function ChatDrawer({
  isOpen,
  onClose,
  currentRole,
  currentUserName = 'User',
  initialThreadId = null,
}: ChatDrawerProps) {
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      const allThreads = getStoredThreads()
      setThreads(allThreads)
      if (initialThreadId && allThreads.some(t => t.id === initialThreadId)) {
        setActiveThreadId(initialThreadId)
      } else if (allThreads.length > 0) {
        setActiveThreadId(allThreads[0].id)
      }
    }
  }, [isOpen, initialThreadId])

  useEffect(() => {
    if (activeThreadId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeThreadId, threads])

  if (!isOpen) return null

  const activeThread = threads.find(t => t.id === activeThreadId)

  // Handle local image file selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      // 1. Try uploading to Supabase Storage portfolio-media bucket
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'png'
      const filePath = `chat/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('portfolio-media')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (!uploadErr && uploadData?.path) {
        const { data: urlData } = supabase.storage.from('portfolio-media').getPublicUrl(uploadData.path)
        setSelectedImage(urlData.publicUrl)
      } else {
        // Fallback to FileReader data URL preview
        const reader = new FileReader()
        reader.onload = () => {
          setSelectedImage(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    } catch {
      const reader = new FileReader()
      reader.onload = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if ((!inputMessage.trim() && !selectedImage) || !activeThreadId || !activeThread) return

    const userText = inputMessage.trim()
    const attachedImg = selectedImage

    // 1. Add message locally for instant optimistic UI
    const updated = sendChatMessage(activeThreadId, currentRole, userText, attachedImg || undefined)
    if (updated) {
      setThreads(getStoredThreads())
    }

    setInputMessage('')
    setSelectedImage(null)

    // 2. Persist message directly into Supabase (pure 2-way conversation, no auto-reply)
    try {
      await fetch('/api/chat/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: activeThread.id,
          creatorId: activeThread.creator_id,
          creatorName: activeThread.creator_name,
          senderName: currentUserName,
          senderRole: currentRole,
          messageText: userText,
          mediaUrl: attachedImg,
        }),
      })
    } catch (err) {
      console.warn('Chat persistence note:', err)
    }
  }

  const quickPrompts = currentRole === 'brand' ? [
    'Are you available for a 3-week brand campaign?',
    'What tools do you use for 4K video upscaling?',
    'Can we discuss commercial rights and deliverables?',
  ] : [
    'Yes, I have availability starting next week!',
    'I use Runway Gen-3 + Midjourney v6 for 4K exports.',
    'Happy to review your brief details and budget.',
  ]

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg h-full glass border-l border-border/60 bg-background/95 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-base leading-tight">CreatorForge Messenger</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <span>Chatting as</span>
                  <span className="font-semibold text-primary capitalize">{currentRole}</span>
                  <span>({currentUserName})</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conversation Navigation tabs if multiple threads */}
          {threads.length > 1 && (
            <div className="px-3 py-2 border-b border-border/40 flex gap-2 overflow-x-auto bg-muted/20">
              {threads.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveThreadId(t.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all ${
                    t.id === activeThreadId
                      ? 'bg-primary/20 border-primary/50 text-foreground font-semibold'
                      : 'border-border/50 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {currentRole === 'brand' ? t.creator_name : (t.brand_name || t.creator_name)}
                </button>
              ))}
            </div>
          )}

          {/* Active Thread Header */}
          {activeThread && (
            <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border border-primary/30 flex items-center justify-center font-bold text-sm">
                  {currentRole === 'brand'
                    ? (activeThread.creator_name[0] || 'C')
                    : (activeThread.brand_name[0] || 'B')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">
                      {currentRole === 'brand' ? activeThread.creator_name : (activeThread.brand_name || activeThread.creator_name)}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Direct conversation saved in Supabase Cloud
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Message History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {(!activeThread || activeThread.messages.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mb-3 opacity-40 text-primary" />
                <p className="font-medium text-sm text-foreground">No messages yet</p>
                <p className="text-xs mt-1 max-w-xs">
                  Start the conversation to discuss deliverables, tools, and visual direction.
                </p>
              </div>
            ) : (
              activeThread.messages.map(msg => {
                const isMe = msg.sender === currentRole || (currentRole === 'user' && msg.sender !== 'creator')
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col animate-in fade-in slide-in-from-bottom-1 duration-200 ${
                      isMe ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                        isMe
                          ? 'gradient-brand text-white rounded-br-none'
                          : 'glass-card border border-border/70 text-foreground rounded-bl-none'
                      }`}
                    >
                      {/* Attached Image if present */}
                      {msg.media_url && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-white/20 max-w-xs cursor-pointer group relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={msg.media_url}
                            alt="Attachment"
                            onClick={() => setExpandedImage(msg.media_url!)}
                            className="w-full h-auto max-h-48 object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      )}
                      {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1 flex items-center gap-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && <CheckCheck className="w-3 h-3 text-primary" />}
                    </span>
                  </div>
                )
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Image Preview Banner if an image is staged for upload */}
          {selectedImage && (
            <div className="px-4 py-2 border-t border-border/40 bg-card/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-primary/40 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedImage} alt="Staged Preview" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Image attached</p>
                  <p className="text-[10px] text-muted-foreground">Ready to send with your message</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedImage(null)}
                className="h-7 w-7 p-0 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Quick prompt suggestions */}
          <div className="px-4 py-2 border-t border-border/30 bg-card/20 flex gap-2 overflow-x-auto">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputMessage(prompt)}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/15 text-muted-foreground hover:text-foreground transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat input box */}
          <form onSubmit={handleSend} className="p-3 border-t border-border/50 bg-card/40 flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            {/* Image attachment button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="h-10 w-10 p-0 rounded-xl border-border/60 hover:border-primary/50 text-muted-foreground hover:text-primary shrink-0"
              title="Attach an image reference"
            >
              {isUploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <LucideImage className="w-4 h-4" />
              )}
            </Button>

            <Input
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder={`Message ${activeThread?.creator_name || 'creator'}...`}
              className="flex-1 bg-background/60 border-border/60 text-sm focus:border-primary/60"
            />

            <Button
              type="submit"
              disabled={(!inputMessage.trim() && !selectedImage) || isUploadingImage}
              className="gradient-brand text-white border-0 px-4 h-10 gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Lightbox Modal for enlarged image view */}
      {expandedImage && (
        <div
          onClick={() => setExpandedImage(null)}
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={expandedImage} alt="Expanded preview" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-background border border-border rounded-full text-foreground hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
