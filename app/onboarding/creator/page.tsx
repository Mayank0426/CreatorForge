'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Plus, X, ChevronRight, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'

const SPECIALIZATION_OPTIONS = [
  'Product Ads', 'Brand Films', 'Social Media Content', 'Anime Animation',
  'Documentary Style', 'Music Videos', '3D Visualization', 'Motion Graphics',
  'Character Animation', 'Logo Animation', 'UI/UX Animation', 'AI Portraits',
]

const TOOL_OPTIONS = [
  'Runway Gen-3', 'Midjourney v6', 'Sora', 'Stable Diffusion', 'ElevenLabs',
  'Pika Labs', 'Kling AI', 'HeyGen', 'Blender', 'After Effects', 'CapCut', 'DaVinci Resolve',
]

const SKILL_OPTIONS = [
  'Prompt Engineering', 'Motion Design', 'Storyboarding', 'Color Grading',
  'Sound Design', 'Video Editing', 'Character Design', '3D Modeling', 'VFX',
  'AI Upscaling', 'LoRA Training', 'ComfyUI Workflows',
]

export default function CreatorOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [specializations, setSpecializations] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [toolsUsed, setToolsUsed] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleItem(arr: string[], setArr: (v: string[]) => void, item: string) {
    setArr(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item])
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      const stored = typeof window !== 'undefined' ? localStorage.getItem('creatorforge_user') : null
      let parsedUserId: string | null = null
      if (stored) {
        try { parsedUserId = JSON.parse(stored).id } catch {}
      }
      const userId = data?.user?.id || parsedUserId

      if (userId) {
        await supabase
          .from('creator_profiles')
          .upsert({
            user_id: userId,
            headline,
            bio,
            specializations,
            skills,
            tools_used: toolsUsed,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })

        await supabase.from('users').update({ onboarding_complete: true }).eq('id', userId)
      }
    } catch (err) {
      console.error('Error saving onboarding data to Supabase:', err)
    }

    if (typeof window !== 'undefined') {
      const profile = { headline, bio, specializations, skills, tools_used: toolsUsed }
      localStorage.setItem('creatorforge_creator_profile', JSON.stringify(profile))
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/8 blur-[100px]" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="bg-primary/20 border border-primary/30 rounded-lg p-1.5">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-xl gradient-text">CreatorForge</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Set up your creator profile</h1>
          <p className="text-muted-foreground">Tell brands what you can create</p>

          {/* Progress */}
          <div className="flex items-center gap-2 justify-center mt-6">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s === step ? 'bg-primary text-primary-foreground' :
                  s < step ? 'bg-primary/30 text-primary' : 'bg-muted text-muted-foreground'
                }`}>{s}</div>
                {s < 3 && <div className={`w-12 h-0.5 ${s < step ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-16 mt-2 text-xs text-muted-foreground">
            <span>About You</span>
            <span>Skills & Tools</span>
            <span>Specializations</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-border/50">
          {/* Step 1 — Basic info */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="headline">Professional Headline *</Label>
                <Input
                  id="headline"
                  placeholder="e.g. AI Filmmaker & Generative Artist"
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  className="bg-background/50 border-border/60"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">{headline.length}/100 characters</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio">Bio *</Label>
                <Textarea
                  id="bio"
                  placeholder="Describe your experience with AI tools, what kind of creative work you do, and what makes your work unique..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="bg-background/50 border-border/60 min-h-[120px]"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground">{bio.length}/2000 characters</p>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!headline || !bio}
                className="w-full gradient-brand text-white border-0 font-semibold py-5"
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 2 — Skills & Tools */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">AI Tools You Use *</Label>
                <div className="flex flex-wrap gap-2">
                  {TOOL_OPTIONS.map(tool => (
                    <button
                      key={tool}
                      onClick={() => toggleItem(toolsUsed, setToolsUsed, tool)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        toolsUsed.includes(tool)
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {toolsUsed.includes(tool) && <span className="mr-1">✓</span>}
                      {tool}
                    </button>
                  ))}
                </div>
                {toolsUsed.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">Select at least 1 tool</p>
                )}
              </div>

              <div>
                <Label className="mb-3 block">Skills *</Label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleItem(skills, setSkills, skill)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        skills.includes(skill)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'border-border/60 text-muted-foreground hover:border-cyan-500/40 hover:text-foreground'
                      }`}
                    >
                      {skills.includes(skill) && <span className="mr-1">✓</span>}
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={toolsUsed.length === 0 || skills.length === 0}
                  className="flex-1 gradient-brand text-white border-0 font-semibold"
                >
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 — Specializations */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">What type of content do you specialize in? *</Label>
                <p className="text-xs text-muted-foreground mb-3">Select all that apply</p>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATION_OPTIONS.map(spec => (
                    <button
                      key={spec}
                      onClick={() => toggleItem(specializations, setSpecializations, spec)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        specializations.includes(spec)
                          ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                          : 'border-border/60 text-muted-foreground hover:border-pink-500/40 hover:text-foreground'
                      }`}
                    >
                      {specializations.includes(spec) && <span className="mr-1">✓</span>}
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {specializations.length > 0 && (
                <div className="glass rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your profile preview</p>
                  <p className="font-semibold">{headline}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...toolsUsed.slice(0, 3), ...specializations.slice(0, 2)].map(tag => (
                      <span key={tag} className="tag-pill">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={specializations.length === 0 || loading}
                  className="flex-1 gradient-brand text-white border-0 font-semibold"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Profile...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Launch My Profile</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
