'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Sparkles, Shield, Zap, Play, Star,
  Users, Briefcase, CheckCircle2, ImageIcon, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import { createClient } from '@/lib/supabase/client'
import type { CreatorProfileWithUser } from '@/types/database'

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Verified Portfolios',
    desc: 'Every portfolio item shows the exact tools, prompts, and workflow. No more guessing what is real.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    icon: Shield,
    title: 'Creator Verification',
    desc: 'We verify tool expertise, commercial licenses, and past work quality. Hire with confidence from day one.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    icon: Zap,
    title: 'AI Brief Builder & Matchmaking',
    desc: 'Describe your vision in plain language — our Creative AI turns it into a structured creative brief and recommends matching creators instantly.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: Play,
    title: 'Motion & Video Native',
    desc: 'Built for the future: video-first portfolio previews, animation showcases, and Runway Gen-3 deliverables.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
  },
]

export default function Home() {
  const [creators, setCreators] = useState<CreatorProfileWithUser[]>([])
  const [stats, setStats] = useState({
    creatorsCount: 3,
    briefsCount: 4,
    portfoliosCount: 4,
    satisfactionRate: '99%',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLiveData() {
      try {
        const supabase = createClient()

        // 1. Fetch live creators from Supabase
        const { data: creatorData } = await supabase
          .from('creator_profiles')
          .select('*, user:users(*)')
          .order('rating', { ascending: false })
          .limit(6)

        if (creatorData && creatorData.length > 0) {
          setCreators(creatorData as unknown as CreatorProfileWithUser[])
        }

        // 2. Fetch live stats from Supabase
        const [cCount, bCount, pCount] = await Promise.all([
          supabase.from('creator_profiles').select('*', { count: 'exact', head: true }),
          supabase.from('briefs').select('*', { count: 'exact', head: true }),
          supabase.from('portfolio_items').select('*', { count: 'exact', head: true }),
        ])

        setStats({
          creatorsCount: cCount.count || 3,
          briefsCount: bCount.count || 4,
          portfoliosCount: pCount.count || 4,
          satisfactionRate: '99%',
        })
      } catch (err) {
        console.error('Failed to load homepage data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadLiveData()
  }, [])

  const dynamicStats = [
    { value: `${stats.creatorsCount}+`, label: 'AI Creators in Supabase', icon: Users },
    { value: `${stats.briefsCount}+`, label: 'Active Live Briefs', icon: Briefcase },
    { value: `${stats.portfoliosCount}+`, label: 'Verified Portfolios', icon: ImageIcon },
    { value: stats.satisfactionRate, label: 'Client Satisfaction', icon: Star },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-16 overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/8 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full bg-pink-500/8 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6 animate-fade-up delay-100">
            <span className="text-foreground">Where Brands Meet </span>
            <br />
            <span className="gradient-text">AI Creative Genius</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up delay-200">
            Hire elite AI filmmakers, generative artists, and animators for campaigns that feel{' '}
            <em className="text-foreground not-italic font-medium">impossibly good</em>.
            Built for the new creative economy.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-up delay-300">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="gradient-brand text-white border-0 btn-glow font-semibold px-8 py-6 text-base rounded-xl glow-purple"
              >
                Start Hiring Creators
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/search">
              <Button
                variant="outline"
                size="lg"
                className="glass border-border/60 hover:border-primary/50 px-8 py-6 text-base rounded-xl"
              >
                Explore Creators
              </Button>
            </Link>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground animate-fade-up delay-400">
            {['Live Supabase Data', 'Verified AI Expertise', 'Commercial Licensing Clarity', 'IP Ownership Protection'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Creator Cards from Supabase */}
        <div className="relative z-10 w-full max-w-5xl mx-auto mt-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Featured AI Creators</h2>
              <p className="text-xs text-muted-foreground">Live profiles fetched directly from Supabase</p>
            </div>
            <Link href="/search" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              View All ({stats.creatorsCount}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {creators.map((creator, i) => (
                <Link
                  key={creator.id}
                  href={`/creators/${creator.id}`}
                  className="glass-card rounded-2xl p-5 border border-border/60 hover:border-primary/50 transition-all card-hover-lift block group"
                >
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/20 border border-primary/30 flex items-center justify-center text-xl shrink-0">
                      {creator.user?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={creator.user.avatar_url}
                          alt={creator.user.name || 'Creator'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>🎨</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                          {creator.user?.name || 'Creator'}
                        </h3>
                        {creator.verification_status === 'verified' && (
                          <span className="verified-badge text-[10px]">✓ Verified</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{creator.headline || 'AI Creative Specialist'}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {creator.bio || 'Crafting generative art and visual campaigns with cutting-edge AI.'}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {creator.tools_used?.slice(0, 3).map((tool: string) => (
                      <span key={tool} className="tag-pill text-xs">{tool}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-foreground font-semibold">
                        {Number(creator.rating || 5.0).toFixed(1)}
                      </span>
                    </div>
                    <span>{creator.completed_projects_count || 0} projects</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Live Dynamic Stats ─── */}
      <section className="py-16 border-y border-border/50 bg-card/20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {dynamicStats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="flex justify-center mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-3xl font-bold gradient-text mb-1">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for the{' '}
              <span className="gradient-text">AI-first</span> creative era
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Traditional creative marketplaces weren&apos;t built for generative AI.
              We were.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className={`glass-card rounded-2xl p-8 border ${feature.bg}`}>
                <div className={`w-12 h-12 rounded-xl ${feature.bg} border flex items-center justify-center mb-5`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-12 text-center border border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-cyan-500/5 rounded-3xl" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 tag-pill mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Brief Builder Included</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Ready to create something{' '}
                <span className="gradient-text">impossible?</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join verified AI creators and forward-thinking brands on CreatorForge.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button size="lg" className="gradient-brand text-white border-0 btn-glow font-semibold px-8">
                    I&apos;m a Brand — Post a Brief
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="outline" size="lg" className="glass border-border/60 hover:border-primary/50 px-8">
                    I&apos;m a Creator — Join Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
