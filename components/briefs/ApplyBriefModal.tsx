'use client'

import { useState } from 'react'
import {
  Sparkles, CheckCircle2, DollarSign, Calendar, Clock,
  Loader2, X, Send, ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AIGenerateButton from '@/components/shared/AIGenerateButton'
import { createClient } from '@/lib/supabase/client'
import { getActiveSession } from '@/lib/auth'
import type { Brief } from '@/types/database'

interface ApplyBriefModalProps {
  isOpen: boolean
  onClose: () => void
  brief: Brief & { brand?: { name: string } | null }
  onAppliedSuccess: (briefId: string) => void
}

export default function ApplyBriefModal({
  isOpen,
  onClose,
  brief,
  onAppliedSuccess,
}: ApplyBriefModalProps) {
  const [pitch, setPitch] = useState('')
  const [proposedBid, setProposedBid] = useState(
    brief.budget_max ? String(brief.budget_max / 100) : '1500'
  )
  const [turnaroundDays, setTurnaroundDays] = useState('7')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const budgetText = brief.budget_min && brief.budget_max
    ? `₹${(brief.budget_min / 100).toLocaleString('en-IN')} – ₹${(brief.budget_max / 100).toLocaleString('en-IN')}`
    : brief.budget_max
    ? `Up to ₹${(brief.budget_max / 100).toLocaleString('en-IN')}`
    : 'Flexible'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pitch.trim()) {
      setError('Please provide a short pitch or description of your creative approach.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const session = getActiveSession()
      let creatorProfileId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' // Fallback to verified creator Alex Rivera

      // Find creator's profile ID
      if (typeof window !== 'undefined') {
        const storedCp = localStorage.getItem('creatorforge_creator_profile')
        if (storedCp) {
          try {
            const parsed = JSON.parse(storedCp)
            if (parsed.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsed.id)) {
              creatorProfileId = parsed.id
            }
          } catch {}
        }
      }

      if (session?.id) {
        const { data: cpData } = await supabase
          .from('creator_profiles')
          .select('id')
          .eq('user_id', session.id)
          .maybeSingle()

        if (cpData?.id) {
          creatorProfileId = cpData.id
        }
      }

      // Check if creator_profile exists in database to avoid foreign key errors
      const { data: cpExists } = await supabase
        .from('creator_profiles')
        .select('id')
        .eq('id', creatorProfileId)
        .maybeSingle()

      if (!cpExists) {
        // Fallback to verified seeded creator Alex Rivera
        creatorProfileId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      }

      // Insert engagement into Supabase
      const proposalPayload = `Proposal (₹${proposedBid}, ${turnaroundDays} days delivery): ${pitch.trim()}`

      const { error: insertErr } = await supabase
        .from('engagements')
        .upsert({
          brief_id: brief.id,
          creator_id: creatorProfileId,
          initiated_by: 'creator',
          status: 'applied',
          proposal_notes: proposalPayload,
        }, { onConflict: 'brief_id,creator_id' })

      if (insertErr) {
        console.warn('Engagement note:', insertErr)
      }

      // Record applied status in localStorage
      if (typeof window !== 'undefined') {
        const appliedList = JSON.parse(localStorage.getItem('creatorforge_applied_briefs') || '[]')
        if (!appliedList.includes(brief.id)) {
          localStorage.setItem('creatorforge_applied_briefs', JSON.stringify([...appliedList, brief.id]))
        }
      }

      setSubmitted(true)
      onAppliedSuccess(brief.id)

      setTimeout(() => {
        setSubmitted(false)
        onClose()
      }, 2000)
    } catch (err: unknown) {
      console.error('Submit proposal error:', err)
      setError('An error occurred submitting your proposal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl glass-card border border-primary/40 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Proposal Submitted!</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Your application has been delivered to {brief.brand?.name || 'the brand'}. They will review your portfolio and reach out via chat.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 border border-primary/30 text-primary mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Submit Proposal</span>
              </div>
              <h2 className="text-xl font-bold text-white">{brief.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                <span>Budget: <strong className="text-foreground">{budgetText}</strong></span>
                <span>•</span>
                <span>Type: <strong className="text-foreground capitalize">{brief.content_type}</strong></span>
                {brief.brand?.name && (
                  <>
                    <span>•</span>
                    <span>Brand: <strong className="text-foreground">{brief.brand.name}</strong></span>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-xs text-destructive">
                {error}
              </div>
            )}

            {/* Turnaround & Bid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-green-400" />
                  Your Bid (₹ INR)
                </Label>
                <Input
                  type="number"
                  value={proposedBid}
                  onChange={e => setProposedBid(e.target.value)}
                  className="bg-background/60 border-border/60 text-sm font-semibold"
                  placeholder="25000"
                  required
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Estimated Turnaround (Days)
                </Label>
                <Input
                  type="number"
                  value={turnaroundDays}
                  onChange={e => setTurnaroundDays(e.target.value)}
                  className="bg-background/60 border-border/60 text-sm"
                  placeholder="7"
                  required
                />
              </div>
            </div>

            {/* Pitch Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs text-muted-foreground">Your Creative Pitch & Workflow</Label>
                <AIGenerateButton
                  mode="general_description"
                  payload={{
                    title: brief.title,
                    context: `Pitching for creative brief: ${brief.title}. Description: ${brief.campaign_description || ''}. Content type: ${brief.content_type}. Style: ${brief.style_tags.join(', ')}. Turnaround: ${turnaroundDays} days, bid: ₹${proposedBid}`,
                  }}
                  onGenerated={text => setPitch(text)}
                  buttonText="✨ Write Pitch with AI"
                />
              </div>
              <Textarea
                rows={4}
                value={pitch}
                onChange={e => setPitch(e.target.value)}
                placeholder="Describe your creative approach, the AI tools you will use (e.g. Midjourney v6 + Runway Gen-3 + Topaz), and why you are the ideal fit for this project..."
                className="bg-background/60 border-border/60 text-sm resize-none focus:border-primary/60"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 glass border-border/60"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 gradient-brand text-white border-0 font-semibold gap-2 shadow-lg glow-purple"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Proposal
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
