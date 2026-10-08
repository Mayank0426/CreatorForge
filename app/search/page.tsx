'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, Star, Briefcase, ImageIcon, Shield, X, Users, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import { createClient } from '@/lib/supabase/client'
import type { CreatorProfile, PortfolioItem, User, CreatorResult } from '@/types/database'

const SKILL_OPTIONS = [
  'Prompt Engineering', 'Motion Design', 'Storyboarding', 'Color Grading',
  'Sound Design', 'Video Editing', 'Character Design', '3D Modeling', 'VFX',
  'AI Upscaling', 'LoRA Training', 'ComfyUI Workflows',
]
const TOOL_OPTIONS = [
  'Runway Gen-3', 'Midjourney v6', 'Sora', 'Stable Diffusion', 'ElevenLabs',
  'Pika Labs', 'Kling AI', 'HeyGen', 'Blender', 'After Effects', 'CapCut',
]
const SPECIALIZATION_OPTIONS = [
  'Product Ads', 'Brand Films', 'Social Media Content', 'Anime Animation',
  'Documentary Style', 'Music Videos', '3D Visualization', 'Motion Graphics',
  'Character Animation', 'Logo Animation',
]

type SortBy = 'rating' | 'newest' | 'portfolio'


export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortBy>('rating')
  const [showFilters, setShowFilters] = useState(false)
  const [results, setResults] = useState<CreatorResult[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [closestMatches, setClosestMatches] = useState<CreatorResult[]>([])

  const search = useCallback(async () => {
    setLoading(true)
    let creators: CreatorResult[] = []

    try {
      const supabase = createClient()

      let q = supabase
        .from('creator_profiles')
        .select(`
          *,
          user:users(*),
          portfolio_items(*)
        `)

      // Apply skill filter
      for (const skill of selectedSkills) {
        q = q.contains('skills', [skill])
      }
      // Apply tool filter
      for (const tool of selectedTools) {
        q = q.contains('tools_used', [tool])
      }
      // Apply specialization filter
      for (const spec of selectedSpecs) {
        q = q.contains('specializations', [spec])
      }
      // Apply sorting
      if (sortBy === 'rating') {
        q = q.order('rating', { ascending: false })
      } else if (sortBy === 'newest') {
        q = q.order('updated_at', { ascending: false })
      }

      const { data } = await q.limit(50)
      creators = (data || []) as CreatorResult[]
    } catch {
      creators = []
    }

    // Apply client-side filters on creators
    if (selectedSkills.length > 0) {
      creators = creators.filter(c => selectedSkills.every(s => c.skills?.includes(s)))
    }
    if (selectedTools.length > 0) {
      creators = creators.filter(c => selectedTools.every(t => c.tools_used?.includes(t)))
    }
    if (selectedSpecs.length > 0) {
      creators = creators.filter(c => selectedSpecs.every(s => c.specializations?.includes(s)))
    }

    // Text search (client-side on name, headline, bio)
    if (query.trim()) {
      const q2 = query.toLowerCase()
      creators = creators.filter(c =>
        c.user?.name?.toLowerCase().includes(q2) ||
        c.headline?.toLowerCase().includes(q2) ||
        c.bio?.toLowerCase().includes(q2) ||
        c.specializations?.some(s => s.toLowerCase().includes(q2)) ||
        c.tools_used?.some(t => t.toLowerCase().includes(q2))
      )
    }

    // Sort by rating / portfolio
    if (sortBy === 'rating') {
      creators.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else if (sortBy === 'portfolio') {
      creators.sort((a, b) => (b.portfolio_items?.length || 0) - (a.portfolio_items?.length || 0))
    }

    const hasFilters = selectedSkills.length > 0 || selectedTools.length > 0 || selectedSpecs.length > 0 || query.trim()

    if (creators.length === 0 && hasFilters) {
      setClosestMatches([])
    } else {
      setClosestMatches([])
    }

    setTotal(creators.length)
    setResults(creators)
    setLoading(false)
  }, [query, selectedSkills, selectedTools, selectedSpecs, sortBy])

  useEffect(() => {
    const timer = setTimeout(search, 50)
    return () => clearTimeout(timer)
  }, [search])

  function toggleFilter(arr: string[], setArr: (v: string[]) => void, item: string) {
    setArr(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item])
  }

  const activeFilterCount = selectedSkills.length + selectedTools.length + selectedSpecs.length

  function clearAllFilters() {
    setSelectedSkills([])
    setSelectedTools([])
    setSelectedSpecs([])
    setQuery('')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex-1">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Discover <span className="gradient-text">AI Creators</span>
          </h1>
          <p className="text-muted-foreground">
            Find elite AI filmmakers, animators, and generative artists for your campaign
          </p>
        </div>

        {/* Search + Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, tool, style, or description..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/60 focus:border-primary/60"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`glass gap-2 shrink-0 ${activeFilterCount > 0 ? 'border-primary/60 text-primary' : 'border-border/60'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full text-xs w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
              className="appearance-none bg-background/50 border border-border/60 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:border-primary/60 cursor-pointer"
            >
              <option value="rating">⭐ Top Rated</option>
              <option value="newest">🆕 Newest</option>
              <option value="portfolio">🖼 Most Portfolio</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="glass-card rounded-xl border border-border/50 p-6 mb-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filter Creators</h3>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="text-xs text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleFilter(selectedSkills, setSelectedSkills, skill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selectedSkills.includes(skill)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'border-border/60 text-muted-foreground hover:border-cyan-500/40'
                      }`}
                    >
                      {selectedSkills.includes(skill) && '✓ '}
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">AI Tools</p>
                <div className="flex flex-wrap gap-2">
                  {TOOL_OPTIONS.map(tool => (
                    <button
                      key={tool}
                      onClick={() => toggleFilter(selectedTools, setSelectedTools, tool)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selectedTools.includes(tool)
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'border-border/60 text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {selectedTools.includes(tool) && '✓ '}
                      {tool}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Specializations</p>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATION_OPTIONS.map(spec => (
                    <button
                      key={spec}
                      onClick={() => toggleFilter(selectedSpecs, setSelectedSpecs, spec)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selectedSpecs.includes(spec)
                          ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                          : 'border-border/60 text-muted-foreground hover:border-pink-500/40'
                      }`}
                    >
                      {selectedSpecs.includes(spec) && '✓ '}
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {[...selectedSkills, ...selectedTools, ...selectedSpecs].map(filter => (
              <div key={filter} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-xs text-primary">
                {filter}
                <button onClick={() => {
                  if (selectedSkills.includes(filter)) setSelectedSkills(prev => prev.filter(s => s !== filter))
                  else if (selectedTools.includes(filter)) setSelectedTools(prev => prev.filter(t => t !== filter))
                  else setSelectedSpecs(prev => prev.filter(s => s !== filter))
                }}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {loading ? 'Searching...' : `${total} creator${total !== 1 ? 's' : ''} found`}
          </span>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card rounded-xl border border-border/50 p-5 h-64 animate-pulse" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map(creator => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        ) : (
          <div>
            {/* Empty state */}
            <div className="glass-card rounded-xl border border-border/50 p-12 text-center mb-8">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No creators match these filters</h3>
              <p className="text-muted-foreground mb-4">
                Try removing one or more filters to see more results
              </p>
              <Button variant="outline" onClick={clearAllFilters} className="glass border-border/60">
                Clear All Filters
              </Button>
            </div>

            {/* Closest matches */}
            {closestMatches.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Here are some top creators you might like:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {closestMatches.map(creator => (
                    <CreatorCard key={creator.id} creator={creator} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

function CreatorCard({ creator }: { creator: CreatorResult }) {
  const portfolioCount = creator.portfolio_items?.length || 0
  const previewItems = creator.portfolio_items?.slice(0, 2) || []

  return (
    <Link href={`/creators/${creator.id}`}>
      <div className="glass-card rounded-xl border border-border/50 overflow-hidden cursor-pointer h-full flex flex-col">
        {/* Portfolio preview strip */}
        {previewItems.length > 0 ? (
          <div className="grid grid-cols-2 h-28 overflow-hidden">
            {previewItems.map((item, idx) => (
              <div key={item.id || idx} className={`relative bg-muted/50 ${idx === 0 && previewItems.length === 1 ? 'col-span-2' : ''}`}>
                {item.media_url ? (
                  item.media_type === 'video' ? (
                    <video src={item.media_url} className="w-full h-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.media_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback image if remote url fails
                        (e.target as HTMLImageElement).src = '/images/ethereal_botanica.jpg'
                      }}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                {portfolioCount > 2 && idx === 1 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">+{portfolioCount - 2}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-28 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="font-semibold truncate">{creator.user?.name}</h3>
                {creator.verification_status === 'verified' && (
                  <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                )}
              </div>
              {creator.headline && (
                <p className="text-xs text-muted-foreground truncate">{creator.headline}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold">{creator.rating?.toFixed(1) || '—'}</span>
            </div>
          </div>

          {/* Specializations */}
          {creator.specializations?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {creator.specializations.slice(0, 2).map(spec => (
                <span key={spec} className="tag-pill-pink text-xs">{spec}</span>
              ))}
            </div>
          )}

          {/* Tools */}
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {creator.tools_used?.slice(0, 3).map(tool => (
              <span key={tool} className="tag-pill text-xs">{tool}</span>
            ))}
            {(creator.tools_used?.length || 0) > 3 && (
              <span className="text-xs text-muted-foreground">+{(creator.tools_used?.length || 0) - 3} more</span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              <span>{creator.completed_projects_count} projects</span>
            </div>
            <div className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{portfolioCount} works</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
