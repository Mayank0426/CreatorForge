'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Zap, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft,
  Building2, Palette, Sparkles, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AnnouncementModal from '@/components/shared/AnnouncementModal'
import { setActiveSession } from '@/lib/auth'

type Role = 'creator' | 'brand'

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role>('creator')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [loggedInName, setLoggedInName] = useState('')

  function handleQuickFill(role: Role) {
    setSelectedRole(role)
    setError(null)
    if (role === 'brand') {
      setEmail('brand.apex@studios.com')
      setPassword('apex123')
    } else {
      setEmail('alex.rivera@aiart.io')
      setPassword('alex123')
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !password) {
      setError('Please provide both email and password.')
      setLoading(false)
      return
    }

    try {
      // 1. Look up user in locally stored registered users
      let foundUser: { id?: string; email: string; name?: string; role: Role } | null = null
      let oppositeRoleUser: { email: string; role: Role } | null = null

      if (typeof window !== 'undefined') {
        const storedUsers = localStorage.getItem('creatorforge_registered_users')
        if (storedUsers) {
          try {
            const list = JSON.parse(storedUsers)
            foundUser = list.find(
              (u: { email: string; role: Role }) =>
                u.email.toLowerCase() === cleanEmail && u.role === selectedRole
            )
            oppositeRoleUser = list.find(
              (u: { email: string; role: Role }) =>
                u.email.toLowerCase() === cleanEmail && u.role !== selectedRole
            )
          } catch {}
        }
      }

      // Check if trying to login under wrong tab
      if (!foundUser && oppositeRoleUser) {
        setError(
          `This email is registered as a ${oppositeRoleUser.role}. Please click the "${oppositeRoleUser.role === 'creator' ? 'Creator' : 'Brand'}" tab above to sign in.`
        )
        setLoading(false)
        return
      }

      // Predefined default accounts
      if (!foundUser) {
        if (selectedRole === 'brand' && cleanEmail === 'brand.apex@studios.com') {
          foundUser = {
            id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
            email: cleanEmail,
            name: 'Apex Studios',
            role: 'brand',
          }
        } else if (selectedRole === 'creator' && cleanEmail === 'alex.rivera@aiart.io') {
          foundUser = {
            id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            email: cleanEmail,
            name: 'Alex Rivera',
            role: 'creator',
          }
        }
      }

      const displayName =
        foundUser?.name ||
        cleanEmail.split('@')[0].replace(/[._]/g, ' ') ||
        (selectedRole === 'brand' ? 'Brand Partner' : 'Creator')

      const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1)
      let userId =
        foundUser?.id ||
        (selectedRole === 'brand' ? 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44' : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')

      // Sync user to Supabase
      try {
        const syncRes = await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            name: capitalizedName,
            role: selectedRole,
          }),
        })
        const syncData = await syncRes.json()
        if (syncData?.user?.id) {
          userId = syncData.user.id
          if (syncData.profile && typeof window !== 'undefined') {
            localStorage.setItem('creatorforge_creator_profile', JSON.stringify(syncData.profile))
          }
        }
      } catch (e) {
        console.warn('Login sync user error:', e)
      }

      const userSession = {
        id: userId,
        email: cleanEmail,
        name: capitalizedName,
        role: selectedRole,
        onboarding_complete: true,
      }

      // Save active session locally
      setActiveSession(userSession)
      setLoggedInName(capitalizedName)
      setShowAnnouncement(true)

      // Direct redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    } catch (err: unknown) {
      console.error('Login error:', err)
      setError('An error occurred during sign in. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden py-12">
      {/* Announcement Modal with direct dashboard navigation */}
      <AnnouncementModal
        isOpen={showAnnouncement}
        type="signed_in"
        userName={loggedInName}
        redirectUrl="/dashboard"
      />

      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back to Home Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>

        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="bg-primary/20 border border-primary/30 rounded-lg p-1.5">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-xl">
              <span className="gradient-text">Creator</span>
              <span className="text-foreground">Forge</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Select your account type to sign in</p>
        </div>

        {/* Form card */}
        <div className="glass-card rounded-2xl p-7 border border-border/50 shadow-2xl">
          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 p-1 bg-muted/40 rounded-xl mb-6 border border-border/40">
            <button
              type="button"
              onClick={() => { setSelectedRole('creator'); setError(null) }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                selectedRole === 'creator'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Creator</span>
            </button>
            <button
              type="button"
              onClick={() => { setSelectedRole('brand'); setError(null) }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                selectedRole === 'brand'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Brand / Client</span>
            </button>
          </div>

          {/* Quick Demo Credentials helper */}
          <div className="mb-5 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-muted-foreground">Demo {selectedRole}: </span>
              <span className="font-mono text-primary font-medium">
                {selectedRole === 'brand' ? 'brand.apex@studios.com' : 'alex.rivera@aiart.io'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleQuickFill(selectedRole)}
              className="text-[11px] font-semibold text-primary hover:underline hover:text-primary/80"
            >
              Fill Demo
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                {selectedRole === 'brand' ? 'Company / Brand Email' : 'Creator Email'}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={selectedRole === 'brand' ? 'brand@company.com' : 'creator@aiart.io'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-9 bg-background/50 border-border/60 focus:border-primary/60"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-9 pr-10 bg-background/50 border-border/60 focus:border-primary/60"
                  required
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
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-brand text-white border-0 btn-glow font-semibold py-5 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In as {selectedRole === 'brand' ? 'Brand' : 'Creator'}...
                </>
              ) : (
                `Sign In as ${selectedRole === 'brand' ? 'Brand' : 'Creator'}`
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              Sign up free
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
