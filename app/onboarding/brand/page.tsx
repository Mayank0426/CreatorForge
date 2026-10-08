'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

const INDUSTRIES = [
  'Technology', 'Fashion & Apparel', 'Food & Beverage', 'Entertainment',
  'Healthcare', 'Finance', 'Automotive', 'Travel & Hospitality', 'E-commerce',
  'Education', 'Real Estate', 'Sports & Fitness', 'Beauty & Cosmetics', 'Other',
]

export default function BrandOnboardingPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [website, setWebsite] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: authData } = await supabase.auth.getUser()
    const stored = typeof window !== 'undefined' ? localStorage.getItem('creatorforge_user') : null
    let parsedUserId: string | null = null
    if (stored) {
      try { parsedUserId = JSON.parse(stored).id } catch {}
    }
    const userId = authData?.user?.id || parsedUserId
    if (!userId) { router.push('/auth/login'); return }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        name: companyName,
        onboarding_complete: true,
      })
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/8 blur-[100px]" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="bg-primary/20 border border-primary/30 rounded-lg p-1.5">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-xl gradient-text">CreatorForge</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Tell us about your brand</h1>
          <p className="text-muted-foreground">We&apos;ll help match you with the right AI creators</p>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-border/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium">Brand / Agency Account</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="e.g. Acme Corp"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="bg-background/50 border-border/60"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Industry *</Label>
              <div className="grid grid-cols-2 gap-2">
                {INDUSTRIES.map(ind => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => setIndustry(ind)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border text-left transition-all ${
                      industry === ind
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'border-border/60 text-muted-foreground hover:border-cyan-500/40'
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="website">Website (optional)</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://yourcompany.com"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                className="bg-background/50 border-border/60"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={!companyName || !industry || loading}
              className="w-full gradient-brand text-white border-0 font-semibold py-5"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting up...</>
              ) : (
                'Go to Dashboard →'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
