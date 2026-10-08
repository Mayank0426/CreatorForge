'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import {
  Zap, Plus, Star, Briefcase, Users, TrendingUp,
  ArrowRight, Shield, ImageIcon, Edit2, Eye, Loader2, MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/shared/Navbar'
import type { CreatorProfile, Brief, PortfolioItem, User } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground text-sm">Loading dashboard from Supabase...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const [loading, setLoading] = useState(true)
  const [dbUser, setDbUser] = useState<User | null>(null)
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null)
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [brandBriefs, setBrandBriefs] = useState<Brief[]>([])
  const [liveCreatorCount, setLiveCreatorCount] = useState(3)
  const [activeChatsCount, setActiveChatsCount] = useState(1)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const supabase = createClient()
        let activeUser: User | null = null

        // 1. Check local session first for instant load
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('creatorforge_user')
          if (stored) {
            try {
              const parsed = JSON.parse(stored)
              if (parsed?.id) {
                activeUser = {
                  id: parsed.id,
                  email: parsed.email || 'user@creatorforge.ai',
                  role: parsed.role || 'creator',
                  name: parsed.name || 'Creator',
                  avatar_url: parsed.avatar_url || null,
                  onboarding_complete: true,
                  created_at: new Date().toISOString(),
                } as User
                // Set immediately for zero-delay instant render
                setDbUser(activeUser)
                setLoading(false)
              }
            } catch {}
          }
        }

        // 2. Check Supabase Auth if no local session
        if (!activeUser) {
          try {
            const { data: authData } = await supabase.auth.getUser()
            if (authData?.user) {
              const { data } = await supabase
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single<User>()
              if (data) activeUser = data
            }
          } catch {}
        }

        // 3. Fallback: fetch latest inserted user from Supabase Cloud
        if (!activeUser) {
          try {
            const { data } = await supabase
              .from('users')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(1)
            if (data && data.length > 0) {
              activeUser = data[0] as User
            }
          } catch {}
        }

        // 4. Default user fallback
        if (!activeUser) {
          activeUser = {
            id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            email: 'alex.rivera@aiart.io',
            role: 'creator',
            name: 'Alex Rivera',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            onboarding_complete: true,
            created_at: new Date().toISOString(),
          }
        }

        setDbUser(activeUser)
        setLoading(false)

        // Fetch role data
        if (activeUser.role === 'creator') {
          let cp: CreatorProfile | null = null

          if (typeof window !== 'undefined') {
            const storedProfile = localStorage.getItem('creatorforge_creator_profile')
            if (storedProfile) {
              try { cp = JSON.parse(storedProfile) } catch {}
            }
          }

          if (!cp) {
            try {
              const { data: profile } = await supabase
                .from('creator_profiles')
                .select('*')
                .eq('user_id', activeUser.id)
                .maybeSingle<CreatorProfile>()
              cp = profile
            } catch {}
          }

          if (!cp) {
            try {
              const { data: defaultProfiles } = await supabase
                .from('creator_profiles')
                .select('*')
                .limit(1)
              if (defaultProfiles && defaultProfiles.length > 0) {
                cp = defaultProfiles[0]
              }
            } catch {}
          }

          if (!cp) {
            cp = {
              id: 'c-new',
              user_id: activeUser.id,
              headline: 'AI Creative Specialist & Filmmaker',
              bio: 'Welcome to CreatorForge! Crafting high-end generative visual content and brand films.',
              specializations: ['AI Art', 'Generative Video'],
              skills: ['Prompt Engineering', 'Motion Design'],
              tools_used: ['Midjourney v6', 'Runway Gen-3'],
              portfolio_links: [],
              verification_status: 'unverified',
              rating: 5.0,
              completed_projects_count: 0,
              updated_at: new Date().toISOString()
            }
          }
          setCreatorProfile(cp)

          if (cp?.id && cp.id !== 'c-new') {
            try {
              const { data: items } = await supabase
                .from('portfolio_items')
                .select('*')
                .eq('creator_id', cp.id)
                .order('created_at', { ascending: false })
                .limit(6)
              setPortfolioItems(items || [])
            } catch {}
          }
        } else {
          try {
            const { data: briefs } = await supabase
              .from('briefs')
              .select('*')
              .eq('brand_id', activeUser.id)
              .order('created_at', { ascending: false })
            setBrandBriefs(briefs || [])
          } catch {}
        }

        // Fetch live creator count from Supabase
        try {
          const { count } = await supabase
            .from('creator_profiles')
            .select('*', { count: 'exact', head: true })
          if (count) setLiveCreatorCount(count)
        } catch {}

        if (typeof window !== 'undefined') {
          try {
            const { getStoredThreads } = await import('@/lib/chat')
            setActiveChatsCount(getStoredThreads().length)
          } catch {}
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading || !dbUser) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground text-sm">Loading your dashboard from Supabase...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex-1">
        {/* Welcome header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, <span className="gradient-text">{dbUser.name?.split(' ')[0] || 'Creator'}</span> 👋
            </h1>
            <p className="text-muted-foreground mt-1 capitalize">
              {dbUser.role} Dashboard
            </p>
          </div>
          {dbUser.role === 'creator' ? (
            <div className="flex gap-3">
              <Link href="/dashboard/portfolio">
                <Button variant="outline" className="glass border-border/60 hover:border-primary/50 gap-2">
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </Button>
              </Link>
              {creatorProfile && creatorProfile.id !== 'c-new' && (
                <Link href={`/creators/${creatorProfile.id}`}>
                  <Button variant="outline" className="glass border-border/60 hover:border-primary/50 gap-2">
                    <Eye className="w-4 h-4" />
                    View Public Profile
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Link href="/briefs/create">
              <Button className="gradient-brand text-white border-0 btn-glow gap-2 font-semibold">
                <Plus className="w-4 h-4" />
                Post a Brief
              </Button>
            </Link>
          )}
        </div>

        {/* Creator Dashboard */}
        {dbUser.role === 'creator' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Rating', value: creatorProfile?.rating ? Number(creatorProfile.rating).toFixed(1) : '5.0', icon: Star, color: 'text-amber-400' },
                { label: 'Projects Completed', value: creatorProfile?.completed_projects_count || 0, icon: Briefcase, color: 'text-cyan-400' },
                { label: 'Portfolio Items', value: portfolioItems.length, icon: ImageIcon, color: 'text-purple-400' },
                { label: 'Brand Inquiries', value: `${activeChatsCount}`, icon: MessageSquare, color: 'text-emerald-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass-card rounded-xl p-5 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                  <div className="text-2xl font-bold capitalize">{String(value)}</div>
                </div>
              ))}
            </div>

            {/* Profile completeness */}
            <div className="glass-card rounded-xl p-6 border border-border/50 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Profile Strength</h2>
                <span className="text-sm text-muted-foreground">
                  {portfolioItems.length > 0 ? 'Strong' : 'Needs portfolio items'}
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Headline & Bio', done: !!(creatorProfile?.headline && creatorProfile?.bio) },
                  { label: 'Skills & Tools', done: !!((creatorProfile?.skills?.length || 0) > 0 && (creatorProfile?.tools_used?.length || 0) > 0) },
                  { label: 'Specializations', done: !!((creatorProfile?.specializations?.length || 0) > 0) },
                  { label: 'Portfolio Items (3+)', done: portfolioItems.length >= 3 },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      done ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {done ? '✓' : '○'}
                    </div>
                    <span className={`text-sm ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio preview */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Portfolio</h2>
              <Link href="/dashboard/portfolio">
                <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary/80">
                  Manage All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {portfolioItems.length === 0 ? (
              <div className="glass-card rounded-xl border-2 border-dashed border-border/50 p-12 text-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No portfolio items yet</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Add your first piece of AI-generated work to attract brands
                </p>
                <Link href="/dashboard/portfolio">
                  <Button className="gradient-brand text-white border-0 gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Portfolio Item
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {portfolioItems.map(item => (
                  <div key={item.id} className="glass-card rounded-xl border border-border/50 overflow-hidden group">
                    <div className="aspect-video bg-muted/50 flex items-center justify-center relative overflow-hidden">
                      {item.media_url ? (
                        item.media_type === 'video' ? (
                          <video src={item.media_url} className="w-full h-full object-cover" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.media_url} alt={item.title} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      )}
                      {item.is_verified && (
                        <div className="absolute top-2 right-2 verified-badge">✓ Verified</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-medium text-sm mb-1 truncate">{item.title}</h4>
                      <div className="flex flex-wrap gap-1">
                        {item.tools_used?.slice(0, 2).map(tool => (
                          <span key={tool} className="tag-pill text-xs">{tool}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/portfolio" className="glass-card rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center p-8 hover:border-primary/50 transition-colors group">
                  <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm text-muted-foreground group-hover:text-primary mt-2 transition-colors">Add More</span>
                </Link>
              </div>
            )}
          </>
        )}

        {/* Brand Dashboard */}
        {dbUser.role === 'brand' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Active Briefs', value: brandBriefs.filter(b => b.status === 'open').length, icon: Briefcase, color: 'text-cyan-400' },
                { label: 'Total Briefs in DB', value: brandBriefs.length, icon: TrendingUp, color: 'text-purple-400' },
                { label: 'Verified Creators', value: `${liveCreatorCount}`, icon: Users, color: 'text-pink-400' },
                { label: 'Chat Inquiries', value: `${activeChatsCount}`, icon: MessageSquare, color: 'text-amber-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass-card rounded-xl p-5 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                  <div className="text-2xl font-bold">{String(value)}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Link href="/briefs/create" className="glass-card rounded-xl p-6 border border-primary/20 hover:border-primary/40 group">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Post a New Brief</h3>
                <p className="text-sm text-muted-foreground">Use AI to structure your brief from a rough idea</p>
              </Link>
              <Link href="/search" className="glass-card rounded-xl p-6 border border-cyan-500/20 hover:border-cyan-500/40 group">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="font-semibold mb-1">Discover Creators</h3>
                <p className="text-sm text-muted-foreground">Filter by skills, tools, and specialization</p>
              </Link>
            </div>

            {/* Briefs list */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Briefs</h2>
              <Link href="/briefs">
                <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary/80">
                  Browse All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {brandBriefs.length === 0 ? (
              <div className="glass-card rounded-xl border-2 border-dashed border-border/50 p-12 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No briefs posted yet</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Post your first brief to start receiving proposals from AI creators
                </p>
                <Link href="/briefs/create">
                  <Button className="gradient-brand text-white border-0 gap-2">
                    <Plus className="w-4 h-4" />
                    Post Your First Brief
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {brandBriefs.map(brief => (
                  <div key={brief.id} className="glass-card rounded-xl p-5 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{brief.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          brief.status === 'open' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          brief.status === 'in-progress' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                          'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {brief.status}
                        </span>
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{brief.content_type}</span>
                        <span>•</span>
                        <span>{brief.aspect_ratio}</span>
                        {brief.budget_max && (
                          <>
                            <span>•</span>
                            <span>Up to ${(brief.budget_max / 100).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Link href={`/search`}>
                      <Button variant="outline" size="sm" className="glass border-border/60 hover:border-primary/50 shrink-0">
                        Find Creators
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
