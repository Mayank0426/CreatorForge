'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Star, MapPin, ExternalLink, Shield, ChevronDown, ImageIcon,
  Briefcase, Link as LinkIcon, Loader2, ArrowLeft, MessageSquare, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/shared/Navbar'
import CreatorPortfolioGrid from '@/components/creator/CreatorPortfolioGrid'
import ChatDrawer from '@/components/chat/ChatDrawer'
import { getOrCreateThread } from '@/lib/chat'
import { getActiveSession } from '@/lib/auth'
import type { CreatorProfileWithPortfolio } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

export default function CreatorProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground text-sm">Loading creator profile...</p>
          </div>
        </div>
      }
    >
      <CreatorProfileContent />
    </Suspense>
  )
}

function CreatorProfileContent() {
  const params = useParams()
  const id = params?.id as string
  const [profile, setProfile] = useState<CreatorProfileWithPortfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showLoginAlert, setShowLoginAlert] = useState(false)
  const [chatThreadId, setChatThreadId] = useState<string | null>(null)

  useEffect(() => {
    async function loadCreatorProfile() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('creator_profiles')
          .select(`
            *,
            user:users(*),
            portfolio_items(*)
          `)
          .eq('id', id)
          .single()

        if (error || !data) {
          setNotFoundState(true)
        } else {
          setProfile(data as unknown as CreatorProfileWithPortfolio)
        }
      } catch {
        setNotFoundState(true)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadCreatorProfile()
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground text-sm">Loading creator profile from Supabase...</p>
        </div>
      </div>
    )
  }

  if (notFoundState || !profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold mb-2">Creator Profile Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested creator profile does not exist in Supabase.</p>
          <Button onClick={() => window.history.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const cp = profile
  const featuredItems = (cp.portfolio_items || [])
    .filter(i => i.is_featured)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const otherItems = (cp.portfolio_items || [])
    .filter(i => !i.is_featured)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const allItems = [...featuredItems, ...otherItems]

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ─── Hero / Profile Header ─── */}
      <div className="relative pt-16 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 relative z-10">
          {/* Back button */}
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Creators</span>
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-2 border-primary/30 flex items-center justify-center">
                  {cp.user?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cp.user.avatar_url}
                      alt={cp.user.name || 'Creator'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">🎨</span>
                  )}
                </div>
                {cp.verification_status === 'verified' && (
                  <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-1 border-2 border-background">
                    <Shield className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-start gap-3 mb-2">
                <h1 className="text-3xl font-bold">{cp.user?.name}</h1>
                {cp.verification_status === 'verified' && (
                  <span className="verified-badge mt-1">✓ Verified Creator</span>
                )}
                {cp.verification_status === 'pending' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 mt-1">
                    Verification Pending
                  </span>
                )}
              </div>

              {cp.headline && (
                <p className="text-lg text-primary font-medium mb-3">{cp.headline}</p>
              )}

              {cp.bio && (
                <p className="text-muted-foreground leading-relaxed mb-4 max-w-2xl">{cp.bio}</p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap gap-6 mb-4">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold">{cp.rating?.toFixed(1) || '—'}</span>
                  <span className="text-muted-foreground text-sm">rating</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold">{cp.completed_projects_count || 0}</span>
                  <span className="text-muted-foreground text-sm">projects</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold">{cp.portfolio_items?.length || 0}</span>
                  <span className="text-muted-foreground text-sm">portfolio items</span>
                </div>
              </div>

              {/* Portfolio links */}
              {cp.portfolio_links && cp.portfolio_links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {cp.portfolio_links.map(link => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-border/60 text-sm hover:border-primary/50 transition-colors"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{link.label}</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              )}

              {/* Chat with Creator Button - Open to Everyone */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => {
                    const session = getActiveSession()
                    const senderId = session?.id || 'guest-' + Date.now()
                    const senderName = session?.name || 'Client'
                    const thread = getOrCreateThread(
                      { id: cp.id, name: cp.user?.name || 'Creator', avatar: cp.user?.avatar_url || undefined },
                      { id: senderId, name: senderName }
                    )
                    setChatThreadId(thread.id)
                    setShowChat(true)
                  }}
                  className="gradient-brand text-white border-0 btn-glow font-semibold gap-2 px-6 py-5 rounded-xl shadow-lg glow-purple"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat with {cp.user?.name || 'Creator'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-8 flex flex-wrap gap-6 border-t border-border/50 pt-6">
            {cp.specializations && cp.specializations.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Specializations</p>
                <div className="flex flex-wrap gap-1.5">
                  {cp.specializations.map(s => (
                    <span key={s} className="tag-pill-cyan">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {cp.skills && cp.skills.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {cp.skills.map(sk => (
                    <span key={sk} className="tag-pill">{sk}</span>
                  ))}
                </div>
              </div>
            )}

            {cp.tools_used && cp.tools_used.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">AI Tools Mastered</p>
                <div className="flex flex-wrap gap-1.5">
                  {cp.tools_used.map(t => (
                    <span key={t} className="tag-pill-pink">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Portfolio Showcase ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Portfolio Showcase</h2>
            <p className="text-muted-foreground text-sm">
              Explore verified AI-generated work, prompts, and workflows
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {allItems.length} piece{allItems.length !== 1 ? 's' : ''}
          </span>
        </div>

        <CreatorPortfolioGrid items={allItems} />
      </section>

      {/* Login Alert Modal for Unauthenticated Visitors */}
      {showLoginAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm glass-card border border-primary/40 rounded-3xl p-7 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Brand Sign In Required</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Please sign in as a Brand to chat with {cp.user?.name || 'this creator'} and discuss campaign deliverables before onboarding.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowLoginAlert(false)}
                className="flex-1 glass border-border/60"
              >
                Cancel
              </Button>
              <Link href="/auth/login" className="flex-1">
                <Button className="w-full gradient-brand text-white border-0 font-semibold btn-glow">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Chat Drawer */}
      <ChatDrawer
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        currentRole={getActiveSession()?.role || 'user'}
        currentUserName={getActiveSession()?.name || 'Guest Client'}
        initialThreadId={chatThreadId}
      />
    </div>
  )
}
