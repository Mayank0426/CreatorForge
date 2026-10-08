'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, Menu, X, LogOut, MessageSquare } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { getActiveSession, clearActiveSession, type StoredUser } from '@/lib/auth'
import AnnouncementModal from '@/components/shared/AnnouncementModal'
import ChatDrawer from '@/components/chat/ChatDrawer'

export default function Navbar() {
  return (
    <Suspense
      fallback={
        <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/40 glass">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <Zap className="w-5 h-5 text-primary" />
              <span className="gradient-text">CreatorForge</span>
            </Link>
          </div>
        </header>
      }
    >
      <NavbarContent />
    </Suspense>
  )
}

function NavbarContent() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeUser, setActiveUser] = useState<StoredUser | { email?: string; id?: string; name?: string; role?: string } | null>(null)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    // 1. Check local session
    const session = getActiveSession()
    if (session) {
      setActiveUser(session)
    }

    // 2. Check Supabase auth
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setActiveUser(prev => prev || { email: data.user.email, id: data.user.id })
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setActiveUser({ email: session.user.email, id: session.user.id })
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navLinks = [
    { href: '/search', label: 'Discover Creators' },
    { href: '/briefs', label: 'Browse Briefs' },
  ]

  async function handleSignOut() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    clearActiveSession()
    setActiveUser(null)
    setShowSignOutModal(true)

    setTimeout(() => {
      window.location.href = '/'
    }, 1200)
  }

  return (
    <>
      <AnnouncementModal
        isOpen={showSignOutModal}
        type="signed_out"
        redirectUrl="/"
      />

      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass border-b border-border/50' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 rounded-lg blur-md group-hover:bg-primary/50 transition-all" />
                <div className="relative bg-primary/20 border border-primary/30 rounded-lg p-1.5">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
              </div>
              <span className="font-bold text-xl tracking-tight">
                <span className="gradient-text">Creator</span>
                <span className="text-foreground">Forge</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === href ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="hidden md:flex items-center gap-3">
              {activeUser ? (
                <>
                  <button
                    onClick={() => setShowChat(true)}
                    className="relative p-2 rounded-xl glass border border-primary/30 hover:border-primary/60 text-primary transition-all duration-200 group"
                    title="Open Messenger (Chat)"
                  >
                    <MessageSquare className="w-4 h-4 transition-transform group-hover:scale-110" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse border-2 border-background" />
                  </button>
                  <Link href="/dashboard">
                    <Button size="sm" className="gradient-brand text-white border-0 btn-glow">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-muted-foreground hover:text-destructive gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="gradient-brand text-white border-0 btn-glow font-semibold">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden glass border-t border-border/50 px-4 py-4 space-y-3">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
              {activeUser ? (
                <>
                  <button
                    onClick={() => { setMobileOpen(false); setShowChat(true) }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl glass border border-primary/30 text-primary font-medium text-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open Messages</span>
                  </button>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full gradient-brand text-white border-0">Dashboard</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setMobileOpen(false); handleSignOut() }}
                    className="w-full text-muted-foreground hover:text-destructive gap-1.5 justify-center"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full gradient-brand text-white border-0">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Messenger Drawer for Creators and Brands */}
      <ChatDrawer
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        currentRole={((activeUser as StoredUser)?.role as 'brand' | 'creator') || 'creator'}
        currentUserName={(activeUser as StoredUser)?.name || (activeUser?.email?.split('@')[0]) || 'User'}
      />
    </>
  )
}
