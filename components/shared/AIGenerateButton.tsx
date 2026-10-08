'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AIGenerateButtonProps {
  mode: 'portfolio_description' | 'workflow_notes' | 'creator_bio' | 'brief_description' | 'general_description'
  payload: {
    title?: string
    media_type?: string
    tools?: string[]
    existing_text?: string
    context?: string
    prompt?: string
  }
  onGenerated: (text: string) => void
  buttonText?: string
  size?: 'sm' | 'default'
  variant?: 'outline' | 'default' | 'ghost'
  className?: string
}

export default function AIGenerateButton({
  mode,
  payload,
  onGenerated,
  buttonText = '✨ Generate with AI',
  size = 'sm',
  variant = 'outline',
  className = '',
}: AIGenerateButtonProps) {
  const [loading, setLoading] = useState(false)
  const [justGenerated, setJustGenerated] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          ...payload,
        }),
      })

      const data = await res.json()
      if (data?.text) {
        onGenerated(data.text)
        setJustGenerated(true)
        setTimeout(() => setJustGenerated(false), 2500)
      }
    } catch (err) {
      console.error('AI generation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={handleGenerate}
      disabled={loading}
      className={`text-xs h-7 px-2.5 rounded-lg border-primary/30 hover:border-primary/60 hover:bg-primary/10 text-primary transition-all duration-200 ${
        loading ? 'opacity-80 cursor-wait' : ''
      } ${className}`}
      title="Generate tailored, high-converting text"
    >
      {loading ? (
        <span className="flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          <span className="text-[11px] font-medium text-primary">Generating...</span>
        </span>
      ) : justGenerated ? (
        <>
          <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
          <span className="text-[11px] font-medium text-emerald-400">Done!</span>
        </>
      ) : (
        <>
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
          <span className="text-[11px] font-medium">{buttonText}</span>
        </>
      )}
    </Button>
  )
}
