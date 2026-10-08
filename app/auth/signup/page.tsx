'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, Mail, Lock, User, Eye, EyeOff, Loader2, Clapperboard, Building2, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AnnouncementModal from '@/components/shared/AnnouncementModal'
import { setActiveSession } from '@/lib/auth'

type Role = 'creator' | 'brand'

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<Role | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAnnouncement, setShowAnnouncement] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const cleanEmail = email.trim().toLowerCase()
      const cleanName = name.trim()
      const userId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : (role === 'brand' ? 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44' : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')

      let dbUserId = userId

      // Sync user directly to Supabase via server route
      try {
        const syncRes = await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            name: cleanName,
            role,
          }),
        })
        const syncData = await syncRes.json()
        if (syncData?.user?.id) {
          dbUserId = syncData.user.id
          if (syncData.profile && typeof window !== 'undefined') {
            localStorage.setItem('creatorforge_creator_profile', JSON.stringify(syncData.profile))
          }
        }
      } catch (syncErr) {
        console.warn('Sync user error:', syncErr)
      }

      const newUser = {
        id: dbUserId,
        email: cleanEmail,
        name: cleanName,
        role,
        password,
        onboarding_complete: true,
        created_at: new Date().toISOString(),
      }

      // Save to registered users list in localStorage (distinguishing by email + role)
      if (typeof window !== 'undefined') {
        const existingUsers = JSON.parse(localStorage.getItem('creatorforge_registered_users') || '[]')
        const filtered = existingUsers.filter(
          (u: { email: string; role: Role }) => !(u.email.toLowerCase() === cleanEmail && u.role === role)
        )
        localStorage.setItem('creatorforge_registered_users', JSON.stringify([...filtered, newUser]))

        // Save default profile if creator (fallback)
        if (role === 'creator' && !localStorage.getItem('creatorforge_creator_profile')) {
          const profile = {
            id: dbUserId,
            user_id: dbUserId,
            headline: 'AI Filmmaker & Generative Visual Creator',
            bio: 'Creator crafting high-end generative visual content and brand films.',
            specializations: ['Brand Films', 'Product Ads', '3D Visualization'],
            skills: ['Prompt Engineering', 'Motion Design', 'Color Grading'],
            tools_used: ['Runway Gen-3', 'Midjourney v6', 'ComfyUI'],
            portfolio_links: [],
            verification_status: 'unverified',
            rating: 5.0,
            completed_projects_count: 0,
            updated_at: new Date().toISOString(),
          }
          localStorage.setItem('creatorforge_creator_profile', JSON.stringify(profile))
        }
      }

      // Set active session with real database ID
      setActiveSession({
        id: dbUserId,
        email: cleanEmail,
        name: cleanName,
        role,
        onboarding_complete: true,
      })

      // Show announcement modal
      setShowAnnouncement(true)

      // Direct redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    } catch (err: unknown) {
      console.error('Signup error:', err)
      setError('An error occurred during account creation. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden py-12">
      {/* Announcement Modal with direct redirect to dashboard */}
      <AnnouncementModal
        isOpen={showAnnouncement}
        type="account_created"
        userName={name}
        redirectUrl="/dashboard"
      />

      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back navigation */}
        {step === 1 ? (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Home</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Role Selection</span>
          </button>
        )}

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-primary/20 border border-primary/30 rounded-lg p-1.5">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-xl">
              <span className="gradient-text">Creator</span>
              <span className="text-foreground">Forge</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-muted-foreground text-sm">Join the AI creative economy</p>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-border/50">
          {/* Step 1 — Role Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-center mb-6">I am joining as a...</p>

              <button
                onClick={() => { setRole('creator'); setStep(2) }}
                className={`w-full p-5 rounded-xl border-2 text-left transition-all group ${
                  role === 'creator'
                    ? 'border-primary bg-primary/10'
                    : 'border-border/60 hover:border-primary/50 glass-card'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Clapperboard className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="font-semibold mb-0.5">AI Creator</div>
                    <div className="text-sm text-muted-foreground">
                      Filmmaker, animator, generative artist
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => { setRole('brand'); setStep(2) }}
                className={`w-full p-5 rounded-xl border-2 text-left transition-all group ${
                  role === 'brand'
                    ? 'border-primary bg-primary/10'
                    : 'border-border/60 hover:border-primary/50 glass-card'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-semibold mb-0.5">Brand / Agency</div>
                    <div className="text-sm text-muted-foreground">
                      Hire AI creators for your campaigns
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Step 2 — Account details */}
          {step === 2 && (
            <form onSubmit={handleSignup} className="space-y-5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mb-2"
              >
                ← Back to role selection
              </button>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                {role === 'creator'
                  ? <Clapperboard className="w-4 h-4 text-purple-400" />
                  : <Building2 className="w-4 h-4 text-cyan-400" />
                }
                <span className="text-sm font-medium capitalize">
                  Signing up as: {role}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">
                  {role === 'brand' ? 'Company Name' : 'Your Name'}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder={role === 'brand' ? 'Acme Studios' : 'Elena Vance'}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="pl-9 bg-background/50 border-border/60"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-9 bg-background/50 border-border/60"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-9 pr-10 bg-background/50 border-border/60"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-brand text-white border-0 btn-glow font-semibold py-5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
