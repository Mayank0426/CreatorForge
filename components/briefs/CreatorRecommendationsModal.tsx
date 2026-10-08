'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Star, MessageSquare, ArrowRight, ShieldCheck, CheckCircle2, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ChatDrawer from '@/components/chat/ChatDrawer'
import { getOrCreateThread } from '@/lib/chat'

interface RecommendedCreator {
  id: string
  name: string
  role: string
  matchScore: number
  specialty: string
  tools: string[]
  rating: number
  avatar: string
  fitReason: string
}

interface CreatorRecommendationsModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateAnother?: () => void
  briefTitle: string
  contentType: string
  styleTags: string[]
}

const DEFAULT_RECOMMENDATIONS: RecommendedCreator[] = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Alex Rivera',
    role: 'Generative AI Director & 3D Artist',
    matchScore: 98,
    specialty: 'Cinematic Product Visualization & 3D Ads',
    tools: ['Midjourney v6', 'Runway Gen-3', 'Blender'],
    rating: 5.0,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    fitReason: 'Top match: Expertise in cinematic lighting and prompt consistency for high-budget campaigns.',
  },
  {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    name: 'Maya Lin',
    role: 'AI Filmmaker & Commercial Director',
    matchScore: 94,
    specialty: 'High-Impact Brand Films & Motion Design',
    tools: ['Runway Gen-3', 'Sora', 'ElevenLabs'],
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    fitReason: 'Strong match: Proven commercial portfolio with 47+ delivered brand campaigns.',
  },
  {
    id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    name: 'Kai Takahashi',
    role: 'Anime & Stylized Character Animator',
    matchScore: 89,
    specialty: 'Stylized Motion & Character Design',
    tools: ['ElevenLabs', 'Pika Labs', 'ComfyUI'],
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    fitReason: 'Specialized match: Ideal for character-driven narratives and dynamic audio-visual sync.',
  },
]

export default function CreatorRecommendationsModal({
  isOpen,
  onClose,
  onCreateAnother,
  briefTitle,
  contentType,
  styleTags,
}: CreatorRecommendationsModalProps) {
  const [chatCreator, setChatCreator] = useState<RecommendedCreator | null>(null)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleStartChat = (creator: RecommendedCreator) => {
    const thread = getOrCreateThread(
      { id: creator.id, name: creator.name, avatar: creator.avatar },
      { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', name: 'Apex Studios (Brand)' }
    )
    setActiveThreadId(thread.id)
    setChatCreator(creator)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-3xl glass-card border border-primary/40 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b border-border/50">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Brief Published Successfully!</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                <span>AI Recommended Creators for Your Brief</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Gemini analyzed &quot;{briefTitle || 'Your Brief'}&quot; and matched creators based on style, tools, and past deliverables.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Creators List */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-6">
            {DEFAULT_RECOMMENDATIONS.map((creator) => (
              <div
                key={creator.id}
                className="glass rounded-2xl p-4 sm:p-5 border border-border/60 hover:border-primary/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start sm:items-center gap-3.5 flex-1">
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-primary/30"
                    />
                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-black font-extrabold text-[10px] px-1.5 py-0.5 rounded-full shadow">
                      {creator.matchScore}%
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                        {creator.name}
                      </h3>
                      <span className="verified-badge">✓ Verified</span>
                    </div>
                    <p className="text-xs text-primary font-medium">{creator.role}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {creator.fitReason}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {creator.tools.map((t) => (
                        <span key={t} className="tag-pill text-[11px] py-0 px-2">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleStartChat(creator)}
                    className="flex-1 sm:flex-none gradient-brand text-white border-0 btn-glow gap-1.5 text-xs font-semibold"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat Now</span>
                  </Button>
                  <Link href={`/creators/${creator.id}`} className="flex-1 sm:flex-none">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs glass border-border/60 hover:border-primary/40"
                    >
                      <span>View Profile</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Your brief has been published! Message creators or continue posting more briefs.
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onCreateAnother && (
                <Button
                  onClick={onCreateAnother}
                  className="flex-1 sm:flex-none gradient-brand text-white border-0 font-semibold gap-1.5 px-5 shadow-lg glow-purple"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Post Another Brief</span>
                </Button>
              )}
              <Link href="/briefs" className="flex-1 sm:flex-none">
                <Button
                  variant="outline"
                  className="w-full glass border-border/60 hover:border-primary/50 text-xs gap-1"
                >
                  <span>Browse All Briefs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Chat Drawer when clicking Chat Now */}
      {chatCreator && (
        <ChatDrawer
          isOpen={!!chatCreator}
          onClose={() => setChatCreator(null)}
          currentRole="brand"
          currentUserName="Apex Studios (Brand)"
          initialThreadId={activeThreadId}
        />
      )}
    </>
  )
}
