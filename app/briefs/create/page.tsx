'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Loader2, ChevronRight, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Navbar from '@/components/shared/Navbar'
import AIGenerateButton from '@/components/shared/AIGenerateButton'
import CreatorRecommendationsModal from '@/components/briefs/CreatorRecommendationsModal'
import { createClient } from '@/lib/supabase/client'
import type { ContentType, AspectRatio, CommercialUseType } from '@/types/database'

const STYLE_TAGS = [
  'Cinematic', '3D', 'Anime', 'Realistic', 'Abstract', 'Vintage', 'Futuristic',
  'Minimalist', 'Luxury', 'Dark & Moody', 'Bright & Colorful', 'Hand-drawn',
  'Surreal', 'Documentary', 'Product-focused', 'Character-driven',
]

interface BriefForm {
  title: string
  campaign_description: string
  content_type: ContentType
  style_tags: string[]
  aspect_ratio: AspectRatio
  commercial_use_type: CommercialUseType
  budget_min: string
  budget_max: string
  deadline: string
}

const DEFAULT_FORM: BriefForm = {
  title: '',
  campaign_description: '',
  content_type: 'video',
  style_tags: [],
  aspect_ratio: '16:9',
  commercial_use_type: 'limited-commercial',
  budget_min: '',
  budget_max: '',
  deadline: '',
}

export default function CreateBriefPage() {
  const router = useRouter()
  const [step, setStep] = useState<'ai' | 'form' | 'review'>('ai')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [form, setForm] = useState<BriefForm>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)

  function toggleStyleTag(tag: string) {
    setForm(prev => ({
      ...prev,
      style_tags: prev.style_tags.includes(tag)
        ? prev.style_tags.filter(t => t !== tag)
        : [...prev.style_tags, tag],
    }))
  }

  async function handleAIBuild() {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setAiError(null)

    try {
      const res = await fetch('/api/ai-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      })

      if (!res.ok) throw new Error('AI service unavailable')
      const data = await res.json()

      setForm(prev => ({
        ...prev,
        title: data.title || prev.title,
        campaign_description: data.campaign_description || prev.campaign_description,
        content_type: data.content_type || prev.content_type,
        style_tags: data.style_tags || prev.style_tags,
        aspect_ratio: data.aspect_ratio || prev.aspect_ratio,
        commercial_use_type: data.commercial_use_type || prev.commercial_use_type,
      }))
    } catch (err) {
      setAiError('AI service is not available. You can fill in the form manually.')
    }

    setAiLoading(false)
    setStep('form')
  }

  const [showRecommendations, setShowRecommendations] = useState(false)

  function handleCreateAnotherBrief() {
    setForm(DEFAULT_FORM)
    setAiPrompt('')
    setStep('ai')
    setShowRecommendations(false)
  }

  async function handleSubmit() {
    setSubmitting(true)

    try {
      const supabase = createClient()
      const stored = typeof window !== 'undefined' ? localStorage.getItem('creatorforge_user') : null
      let parsedUserId: string | null = null
      let parsedUserName = 'Brand Partner'
      let parsedUserEmail = 'brand@creatorforge.ai'
      if (stored) {
        try {
          const u = JSON.parse(stored)
          parsedUserId = u.id
          if (u.name) parsedUserName = u.name
          if (u.email) parsedUserEmail = u.email
        } catch {}
      }

      const isValidUuid = (id?: string | null) =>
        Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))

      let brandId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44' // Verified Apex Studios brand
      if (isValidUuid(parsedUserId)) {
        const { data: userRow } = await supabase.from('users').select('id').eq('id', parsedUserId!).maybeSingle()
        if (userRow?.id) {
          brandId = userRow.id
        } else {
          const { error: upsertErr } = await supabase.from('users').upsert({
            id: parsedUserId,
            email: parsedUserEmail,
            name: parsedUserName,
            role: 'brand',
            onboarding_complete: true,
          })
          if (!upsertErr) {
            brandId = parsedUserId!
          }
        }
      }

      const campaignDesc = form.campaign_description?.trim() || form.title || 'Creative campaign brief for generative media.'

      const minNum = form.budget_min ? parseInt(form.budget_min.replace(/[^0-9]/g, ''), 10) : null
      const maxNum = form.budget_max ? parseInt(form.budget_max.replace(/[^0-9]/g, ''), 10) : null
      const cleanMin = minNum && !isNaN(minNum) ? minNum * 100 : null
      const cleanMax = maxNum && !isNaN(maxNum) ? maxNum * 100 : null
      const cleanDeadline = form.deadline && /^\d{4}-\d{2}-\d{2}$/.test(form.deadline) ? form.deadline : null

      const { error: insertErr } = await supabase.from('briefs').insert({
        brand_id: brandId,
        title: form.title,
        campaign_description: campaignDesc,
        content_type: form.content_type || 'video',
        style_tags: form.style_tags.length > 0 ? form.style_tags : ['Cinematic'],
        aspect_ratio: form.aspect_ratio || '16:9',
        commercial_use_type: form.commercial_use_type || 'full-commercial',
        budget_min: cleanMin,
        budget_max: cleanMax,
        deadline: cleanDeadline,
        ai_generated: aiPrompt.trim().length > 0,
        status: 'open',
      })

      if (insertErr) {
        console.warn('Brief insert note:', insertErr)
      }
    } catch (err) {
      console.warn('Brief submission warning:', err)
    }

    // Save locally for demo fallback
    if (typeof window !== 'undefined') {
      const newBrief = {
        id: `b-custom-${Date.now()}`,
        brand_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
        title: form.title,
        campaign_description: form.campaign_description || form.title,
        content_type: form.content_type,
        style_tags: form.style_tags,
        aspect_ratio: form.aspect_ratio,
        commercial_use_type: form.commercial_use_type,
        budget_range: `₹${form.budget_min || '10,000'} - ₹${form.budget_max || '50,000'}`,
        deadline: form.deadline || '2026-11-30',
        status: 'open',
        ai_generated: aiPrompt.trim().length > 0,
        created_at: new Date().toISOString()
      }
      const existing = JSON.parse(localStorage.getItem('creatorforge_custom_briefs') || '[]')
      localStorage.setItem('creatorforge_custom_briefs', JSON.stringify([newBrief, ...existing]))
    }

    setSubmitting(false)
    setShowRecommendations(true)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Back navigation */}
        <Link
          href="/briefs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Briefs</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Post a <span className="gradient-text">Creative Brief</span>
          </h1>
          <p className="text-muted-foreground">Connect with AI creators who can bring your vision to life</p>

          {/* Progress */}
          <div className="flex items-center gap-2 mt-6">
            {(['ai', 'form', 'review'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s === step ? 'bg-primary text-primary-foreground' :
                  (step === 'form' && s === 'ai') || step === 'review'
                    ? 'bg-primary/30 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {(step === 'form' && s === 'ai') || (step === 'review' && s !== 'review')
                    ? <Check className="w-4 h-4" />
                    : i + 1}
                </div>
                {i < 2 && <div className={`w-12 h-0.5 ${step === 'review' || (step === 'form' && s === 'ai') ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
          <div className="flex gap-10 mt-2 text-xs text-muted-foreground">
            <span>AI Builder</span>
            <span>Brief Details</span>
            <span>Review</span>
          </div>
        </div>

        {/* Step 1: AI Builder */}
        {step === 'ai' && (
          <div className="glass-card rounded-2xl border border-primary/20 p-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-lg">AI Brief Builder</h2>
              <span className="tag-pill text-xs">AI Powered</span>
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              Describe your campaign idea in plain language — our AI will structure it into a complete brief.
            </p>

            <div className="space-y-4">
              <Textarea
                placeholder="e.g. I need a 30-second product video for our new sneaker line. It should feel cinematic and futuristic, targeting Gen Z on Instagram Reels. We want full commercial rights."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                className="bg-background/50 border-border/60 min-h-[140px] text-sm"
              />

              {aiError && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-400">
                  {aiError}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleAIBuild}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="flex-1 gradient-brand text-white border-0 font-semibold"
                >
                  {aiLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Brief...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Generate Brief with AI</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep('form')}
                  className="glass border-border/60"
                >
                  Skip, fill manually
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Brief Form */}
        {step === 'form' && (
          <div className="space-y-6">
            {aiPrompt && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Brief pre-filled by AI — review and edit below</span>
              </div>
            )}

            <div className="glass-card rounded-2xl border border-border/50 p-6 space-y-5">
              <div className="space-y-1.5">
                <Label>Brief Title *</Label>
                <Input
                  placeholder="e.g. Nike Sneaker Launch — Instagram Reels Campaign"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="bg-background/50 border-border/60"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Campaign Description *</Label>
                  <AIGenerateButton
                    mode="brief_description"
                    payload={{
                      title: form.title,
                      existing_text: form.campaign_description,
                      context: `Content type: ${form.content_type}, style tags: ${form.style_tags.join(', ')}`,
                    }}
                    onGenerated={text => setForm(p => ({ ...p, campaign_description: text }))}
                    buttonText="✨ AI Expand"
                  />
                </div>
                <Textarea
                  placeholder="Full description of your campaign, target audience, mood, messaging..."
                  value={form.campaign_description}
                  onChange={e => setForm(p => ({ ...p, campaign_description: e.target.value }))}
                  className="bg-background/50 border-border/60 min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Content Type *</Label>
                  <div className="space-y-2">
                    {(['video', 'image', 'animation', 'other'] as ContentType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setForm(p => ({ ...p, content_type: type }))}
                        className={`w-full py-2 px-3 rounded-lg text-sm border capitalize text-left transition-all ${
                          form.content_type === type
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'border-border/60 text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {form.content_type === type && '✓ '}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Aspect Ratio</Label>
                    <div className="space-y-2">
                      {(['16:9', '9:16', '1:1', 'other'] as AspectRatio[]).map(ratio => (
                        <button
                          key={ratio}
                          onClick={() => setForm(p => ({ ...p, aspect_ratio: ratio }))}
                          className={`w-full py-2 px-3 rounded-lg text-sm border text-left transition-all ${
                            form.aspect_ratio === ratio
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                              : 'border-border/60 text-muted-foreground hover:border-cyan-500/40'
                          }`}
                        >
                          {form.aspect_ratio === ratio && '✓ '}
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Style Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleStyleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.style_tags.includes(tag)
                          ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                          : 'border-border/60 text-muted-foreground hover:border-pink-500/40'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Commercial Use Rights *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'internal-only', label: 'Internal Only', desc: 'Not for public use' },
                    { value: 'limited-commercial', label: 'Limited Commercial', desc: 'Specific channels/duration' },
                    { value: 'full-commercial', label: 'Full Commercial', desc: 'All channels, unlimited' },
                    { value: 'resale', label: 'Resale Rights', desc: 'Can resell the content' },
                  ] as const).map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setForm(p => ({ ...p, commercial_use_type: value }))}
                      className={`p-3 rounded-lg text-left border transition-all ${
                        form.commercial_use_type === value
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'border-border/60 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Budget Min (₹)</Label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={form.budget_min}
                    onChange={e => setForm(p => ({ ...p, budget_min: e.target.value }))}
                    className="bg-background/50 border-border/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Budget Max (₹)</Label>
                  <Input
                    type="number"
                    placeholder="50000"
                    value={form.budget_max}
                    onChange={e => setForm(p => ({ ...p, budget_max: e.target.value }))}
                    className="bg-background/50 border-border/60"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                  className="bg-background/50 border-border/60"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('ai')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep('review')}
                disabled={!form.title || !form.campaign_description}
                className="flex-1 gradient-brand text-white border-0 font-semibold"
              >
                Review Brief <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="glass-card rounded-2xl border border-border/50 p-6 space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-5 h-5 text-green-400" />
                <h2 className="font-semibold">Review Your Brief</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Title</p>
                  <p className="font-semibold">{form.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{form.campaign_description}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Type</p>
                    <p className="text-sm capitalize font-medium">{form.content_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ratio</p>
                    <p className="text-sm font-medium">{form.aspect_ratio}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Rights</p>
                    <p className="text-sm font-medium capitalize">{form.commercial_use_type}</p>
                  </div>
                </div>
                {form.style_tags.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Styles</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.style_tags.map(tag => (
                        <span key={tag} className="tag-pill-pink">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(form.budget_min || form.budget_max) && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Budget</p>
                    <p className="text-sm font-medium">
                      ₹{form.budget_min || '0'} — ₹{form.budget_max || '∞'}
                    </p>
                  </div>
                )}
                {form.deadline && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Deadline</p>
                    <p className="text-sm font-medium">{new Date(form.deadline).toLocaleDateString()}</p>
                  </div>
                )}
                {aiPrompt && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-muted-foreground">AI-assisted brief</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('form')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Edit
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 gradient-brand text-white border-0 font-semibold py-5"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publishing...</>
                ) : (
                  <>Publish Brief →</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreatorRecommendationsModal
        isOpen={showRecommendations}
        onClose={handleCreateAnotherBrief}
        onCreateAnother={handleCreateAnotherBrief}
        briefTitle={form.title}
        contentType={form.content_type}
        styleTags={form.style_tags}
      />
    </div>
  )
}
