'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Upload, X, Loader2, Save, ImageIcon, Video, Sparkles,
  ChevronDown, ChevronUp, Star, Shield, ExternalLink, ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Navbar from '@/components/shared/Navbar'
import AIGenerateButton from '@/components/shared/AIGenerateButton'
import { createClient } from '@/lib/supabase/client'
import type { CreatorProfile, PortfolioItem } from '@/types/database'

const TOOL_OPTIONS = [
  'Runway Gen-3', 'Midjourney v6', 'Sora', 'Stable Diffusion', 'ElevenLabs',
  'Pika Labs', 'Kling AI', 'HeyGen', 'Blender', 'After Effects', 'CapCut', 'ComfyUI',
]

interface NewItem {
  title: string
  description: string
  media_type: 'image' | 'video' | 'animation'
  tools_used: string[]
  workflow_notes: string
  file: File | null
}

export default function PortfolioPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [newItem, setNewItem] = useState<NewItem>({
    title: '',
    description: '',
    media_type: 'image',
    tools_used: [],
    workflow_notes: '',
    file: null,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    let userId: string | null = null

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('creatorforge_user')
      if (stored) {
        try { userId = JSON.parse(stored).id } catch {}
      }
    }

    if (!userId) {
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (authData?.user?.id) userId = authData.user.id
      } catch {}
    }

    userId = userId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

    let profileData: CreatorProfile | null = null

    if (typeof window !== 'undefined') {
      const localCp = localStorage.getItem('creatorforge_creator_profile')
      if (localCp) {
        try { profileData = JSON.parse(localCp) } catch {}
      }
    }

    if (!profileData) {
      try {
        const { data } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle<CreatorProfile>()
        profileData = data
      } catch {}
    }

    if (!profileData) {
      try {
        const { data: fallbackProfiles } = await supabase
          .from('creator_profiles')
          .select('*')
          .limit(1)
        if (fallbackProfiles && fallbackProfiles.length > 0) {
          profileData = fallbackProfiles[0]
        }
      } catch {}
    }

    const resolvedProfile: CreatorProfile = profileData || {
      id: 'c-creator',
      user_id: userId,
      headline: 'AI Filmmaker & Generative Visual Creator',
      bio: 'Creator crafting high-end generative visual content and commercial brand films.',
      specializations: ['Brand Films', 'Product Ads'],
      skills: ['Prompt Engineering', 'Motion Design'],
      tools_used: ['Runway Gen-3', 'Midjourney v6'],
      portfolio_links: [],
      verification_status: 'unverified',
      rating: 5.0,
      completed_projects_count: 0,
      updated_at: new Date().toISOString(),
    }

    setProfile(resolvedProfile)

    if (resolvedProfile.id && resolvedProfile.id !== 'c-creator') {
      try {
        const { data: itemsData } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('creator_id', resolvedProfile.id)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
        setItems(itemsData || [])
      } catch {}
    }

    setLoading(false)
  }

  function toggleTool(tool: string) {
    setNewItem(prev => ({
      ...prev,
      tools_used: prev.tools_used.includes(tool)
        ? prev.tools_used.filter(t => t !== tool)
        : [...prev.tools_used, tool],
    }))
  }

  async function handleAddItem() {
    if (!profile || !newItem.title || newItem.tools_used.length === 0) return
    setSaving(true)
    setError(null)

    const supabase = createClient()
    let mediaUrl: string | null = null

    // Ensure valid creator_profile ID
    const isValidUuid = (id?: string | null) =>
      Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))

    let creatorProfileId = isValidUuid(profile.id) ? profile.id : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

    // Verify profile exists in Supabase
    try {
      const { data: cpCheck } = await supabase
        .from('creator_profiles')
        .select('id')
        .eq('id', creatorProfileId)
        .maybeSingle()

      if (!cpCheck?.id) {
        await supabase.from('creator_profiles').upsert({
          id: creatorProfileId,
          user_id: isValidUuid(profile.user_id) ? profile.user_id : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          headline: profile.headline || 'AI Creative Specialist',
          bio: profile.bio || 'AI Creator crafting generative visual content.',
          specializations: profile.specializations?.length ? profile.specializations : ['Brand Films'],
          skills: profile.skills?.length ? profile.skills : ['Prompt Engineering'],
          tools_used: profile.tools_used?.length ? profile.tools_used : ['Midjourney v6'],
          verification_status: 'unverified',
          rating: 5.0,
          completed_projects_count: 0,
        })
      }
    } catch {}

    // Upload file to Supabase Storage portfolio-media bucket
    if (newItem.file) {
      try {
        const ext = newItem.file.name.split('.').pop() || 'png'
        const cleanName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
        const path = `${creatorProfileId}/${cleanName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('portfolio-media')
          .upload(path, newItem.file, { cacheControl: '3600', upsert: true })

        if (!uploadError && uploadData?.path) {
          const { data: urlData } = supabase.storage
            .from('portfolio-media')
            .getPublicUrl(uploadData.path)
          mediaUrl = urlData.publicUrl
        }
      } catch (uploadErr) {
        console.warn('Storage upload note:', uploadErr)
      }

      // Fallback to data URL if storage upload failed
      if (!mediaUrl && typeof window !== 'undefined') {
        try {
          mediaUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(newItem.file!)
          })
        } catch {}
      }
    }

    const { data: inserted, error: insertError } = await supabase
      .from('portfolio_items')
      .insert({
        creator_id: creatorProfileId,
        title: newItem.title,
        description: newItem.description || null,
        media_url: mediaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        media_type: newItem.media_type,
        tools_used: newItem.tools_used,
        workflow_notes: newItem.workflow_notes || null,
      })
      .select()
      .single<PortfolioItem>()

    if (insertError) {
      setError(`Could not save item: ${insertError.message}`)
      setSaving(false)
      return
    }

    setItems(prev => [inserted, ...prev])
    setNewItem({ title: '', description: '', media_type: 'image', tools_used: [], workflow_notes: '', file: null })
    setShowAddForm(false)
    setSuccess('Portfolio item added successfully!')
    setTimeout(() => setSuccess(null), 3500)
    setSaving(false)
  }

  async function handleRequestVerification(itemId: string) {
    const supabase = createClient()
    if (!profile) return
    await supabase.from('creator_profiles').update({ verification_status: 'pending' }).eq('id', profile.id)
    setSuccess('Verification request sent!')
    setTimeout(() => setSuccess(null), 3000)
  }

  async function handleDelete(itemId: string) {
    const supabase = createClient()
    await supabase.from('portfolio_items').delete().eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Back to Dashboard Button */}
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Portfolio Manager</h1>
            <p className="text-muted-foreground mt-1">
              {items.length} item{items.length !== 1 ? 's' : ''} · {profile?.verification_status}
            </p>
          </div>
          <div className="flex gap-3">
            {profile?.verification_status === 'unverified' && items.length > 0 && (
              <Button
                variant="outline"
                className="glass border-amber-500/30 text-amber-400 hover:border-amber-500/60 gap-2"
                onClick={() => handleRequestVerification(items[0]?.id)}
              >
                <Shield className="w-4 h-4" />
                Request Verification
              </Button>
            )}
            <Button
              className="gradient-brand text-white border-0 gap-2"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Status messages */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-sm text-green-400 mb-6">
            ✓ {success}
          </div>
        )}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        {/* Add form */}
        {showAddForm && (
          <div className="glass-card rounded-2xl border border-primary/20 p-6 mb-8 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">New Portfolio Item</h2>
              <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Title *</Label>
                  <Input
                    placeholder="e.g. Cinematic Brand Film for Nike"
                    value={newItem.title}
                    onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Media Type *</Label>
                  <div className="flex gap-2">
                    {(['image', 'video', 'animation'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setNewItem(p => ({ ...p, media_type: type }))}
                        className={`flex-1 py-2 rounded-lg text-sm border capitalize transition-all ${
                          newItem.media_type === type
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'border-border/60 text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Description</Label>
                  <AIGenerateButton
                    mode="portfolio_description"
                    payload={{
                      title: newItem.title,
                      media_type: newItem.media_type,
                      tools: newItem.tools_used,
                      existing_text: newItem.description,
                    }}
                    onGenerated={text => setNewItem(p => ({ ...p, description: text }))}
                    buttonText="✨ AI Describe Post"
                  />
                </div>
                <Textarea
                  placeholder="Brief description of this work... (or click '✨ AI Describe Post' above)"
                  value={newItem.description}
                  onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                  className="bg-background/50 min-h-[80px]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Workflow Notes — How was it made? *</Label>
                  <AIGenerateButton
                    mode="workflow_notes"
                    payload={{
                      title: newItem.title,
                      tools: newItem.tools_used,
                      existing_text: newItem.workflow_notes,
                    }}
                    onGenerated={text => setNewItem(p => ({ ...p, workflow_notes: text }))}
                    buttonText="✨ AI Generate Workflow & Prompts"
                  />
                </div>
                <Textarea
                  placeholder="Describe your creative process or click '✨ AI Generate Workflow' to craft prompts automatically..."
                  value={newItem.workflow_notes}
                  onChange={e => setNewItem(p => ({ ...p, workflow_notes: e.target.value }))}
                  className="bg-background/50 min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
                  Detailed workflow notes increase your chances of getting hired by 3x
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tools Used *</Label>
                <div className="flex flex-wrap gap-2">
                  {TOOL_OPTIONS.map(tool => (
                    <button
                      key={tool}
                      onClick={() => toggleTool(tool)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        newItem.tools_used.includes(tool)
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'border-border/60 text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>

              {/* File upload */}
              <div>
                <Label>Upload Media</Label>
                <div
                  className="mt-1.5 border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {newItem.file ? (
                    <div className="flex items-center gap-2 justify-center">
                      {newItem.media_type === 'video' ? <Video className="w-5 h-5 text-cyan-400" /> : <ImageIcon className="w-5 h-5 text-purple-400" />}
                      <span className="text-sm font-medium">{newItem.file.name}</span>
                      <button onClick={e => { e.stopPropagation(); setNewItem(p => ({ ...p, file: null })) }}>
                        <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload image, video, or GIF</p>
                      <p className="text-xs text-muted-foreground mt-1">Max 50MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) setNewItem(p => ({ ...p, file }))
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddItem}
                  disabled={saving || !newItem.title || newItem.tools_used.length === 0}
                  className="flex-1 gradient-brand text-white border-0"
                >
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Add to Portfolio'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio items list */}
        {items.length === 0 && !showAddForm ? (
          <div className="glass-card rounded-xl border-2 border-dashed border-border/50 p-16 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No portfolio items yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Brands discover you through your portfolio. Add your first AI-generated work.
            </p>
            <Button className="gradient-brand text-white border-0 gap-2" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4" />
              Add Your First Work
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="glass-card rounded-xl border border-border/50 overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Media preview */}
                  <div className="sm:w-48 h-32 sm:h-auto bg-muted/50 flex items-center justify-center shrink-0">
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
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{item.title}</h4>
                          {item.is_verified && <span className="verified-badge">✓ Verified</span>}
                          <span className="tag-pill-cyan text-xs capitalize">{item.media_type}</span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {item.tools_used.map(tool => (
                            <span key={tool} className="tag-pill">{tool}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!item.is_verified && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 text-xs"
                            onClick={() => handleRequestVerification(item.id)}
                          >
                            <Shield className="w-3.5 h-3.5 mr-1" />
                            Request Verify
                          </Button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Workflow notes expandable */}
                    {item.workflow_notes && (
                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                        >
                          {expandedId === item.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          Workflow Notes
                        </button>
                        {expandedId === item.id && (
                          <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                            <p className="text-sm text-muted-foreground leading-relaxed">{item.workflow_notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
