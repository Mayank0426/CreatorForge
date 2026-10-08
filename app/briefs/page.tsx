'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Calendar, DollarSign, Tag, Zap, Sparkles, Loader2, CheckCircle2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import ApplyBriefModal from '@/components/briefs/ApplyBriefModal'
import { createClient } from '@/lib/supabase/client'
import { getActiveSession } from '@/lib/auth'
import type { Brief } from '@/types/database'

type BriefWithBrand = Brief & { brand?: { name: string } | null }

export default function BrowseBriefsPage() {
  const [briefs, setBriefs] = useState<BriefWithBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBriefToApply, setSelectedBriefToApply] = useState<BriefWithBrand | null>(null)
  const [appliedBriefIds, setAppliedBriefIds] = useState<string[]>([])
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    async function loadBriefs() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('briefs')
          .select('*, brand:users(name)')
          .order('created_at', { ascending: false })

        if (data) {
          setBriefs(data as BriefWithBrand[])
        }
      } catch (err) {
        console.error('Failed to load briefs:', err)
      } finally {
        setLoading(false)
      }
    }

    loadBriefs()

    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('creatorforge_applied_briefs') || '[]')
        setAppliedBriefIds(stored)
      } catch {}
    }
  }, [])

  const handleApplyClick = (brief: BriefWithBrand) => {
    const session = getActiveSession()
    if (!session) {
      setShowLoginPrompt(true)
      return
    }
    setSelectedBriefToApply(brief)
  }

  const handleApplySuccess = (briefId: string) => {
    setAppliedBriefIds(prev => [...prev, briefId])
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Open <span className="gradient-text">Briefs</span>
            </h1>
            <p className="text-muted-foreground">
              {briefs.length} active brief{briefs.length !== 1 ? 's' : ''} from brands looking for AI creators
            </p>
          </div>
          <Link href="/briefs/create">
            <Button className="gradient-brand text-white border-0 btn-glow gap-2 font-semibold shrink-0">
              <Plus className="w-4 h-4" />
              Post a Brief
            </Button>
          </Link>
        </div>

        {/* Briefs list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground text-sm">Loading creative briefs from Supabase...</p>
          </div>
        ) : briefs.length === 0 ? (
          <div className="glass-card rounded-xl border-2 border-dashed border-border/50 p-16 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No open briefs yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to post a creative brief</p>
            <Link href="/briefs/create">
              <Button className="gradient-brand text-white border-0 gap-2">
                <Plus className="w-4 h-4" />
                Post the First Brief
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {briefs.map(brief => {
              const isApplied = appliedBriefIds.includes(brief.id)
              return (
                <BriefCard
                  key={brief.id}
                  brief={brief}
                  isApplied={isApplied}
                  onApply={() => handleApplyClick(brief)}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Proposal Modal */}
      {selectedBriefToApply && (
        <ApplyBriefModal
          isOpen={!!selectedBriefToApply}
          onClose={() => setSelectedBriefToApply(null)}
          brief={selectedBriefToApply}
          onAppliedSuccess={handleApplySuccess}
        />
      )}

      {/* Sign In Prompt Modal if visitor is not logged in */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-card border border-primary/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sign In to Apply</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Please sign in with your Creator account so your proposal, rating, and verified portfolio are attached to this brief.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 glass"
              >
                Cancel
              </Button>
              <Link href="/auth/login" className="flex-1">
                <Button className="w-full gradient-brand text-white border-0 font-semibold">
                  Sign In Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

function BriefCard({
  brief,
  isApplied,
  onApply,
}: {
  brief: BriefWithBrand
  isApplied: boolean
  onApply: () => void
}) {
  const budgetText = brief.budget_min && brief.budget_max
    ? `₹${(brief.budget_min / 100).toLocaleString('en-IN')} – ₹${(brief.budget_max / 100).toLocaleString('en-IN')}`
    : brief.budget_max
    ? `Up to ₹${(brief.budget_max / 100).toLocaleString('en-IN')}`
    : 'Budget flexible'

  const daysLeft = brief.deadline
    ? Math.ceil((new Date(brief.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="glass-card rounded-xl border border-border/50 p-6 hover:border-primary/30 transition-all card-hover-lift">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{brief.title}</h3>
            {brief.ai_generated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/15 text-primary border border-primary/30">
                <Sparkles className="w-3 h-3" />
                AI Brief
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              brief.content_type === 'video' ? 'tag-pill-cyan' :
              brief.content_type === 'animation' ? 'tag-pill-pink' :
              'tag-pill'
            }`}>
              {brief.content_type}
            </span>
          </div>

          {brief.campaign_description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
              {brief.campaign_description}
            </p>
          )}

          {/* Style tags */}
          {brief.style_tags && brief.style_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {brief.style_tags.slice(0, 4).map(tag => (
                <span key={tag} className="tag-pill-pink text-xs">{tag}</span>
              ))}
              {brief.style_tags.length > 4 && (
                <span className="text-xs text-muted-foreground">+{brief.style_tags.length - 4} more</span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-green-400" />
              <span className="text-foreground font-medium">{budgetText}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{brief.aspect_ratio} · {brief.commercial_use_type}</span>
            </div>
            {daysLeft !== null && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span className={daysLeft < 7 ? 'text-red-400 font-medium' : ''}>
                  {daysLeft > 0 ? `${daysLeft}d left` : 'Deadline passed'}
                </span>
              </div>
            )}
            {brief.brand?.name && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>by {brief.brand.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center">
          {isApplied ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Applied ✓</span>
            </div>
          ) : (
            <Button
              onClick={onApply}
              size="sm"
              className="gradient-brand text-white border-0 font-semibold shadow-md hover:scale-105 transition-transform"
            >
              Apply Now
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
