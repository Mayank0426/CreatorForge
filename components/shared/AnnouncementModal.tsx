'use client'

import { useEffect } from 'react'
import { Sparkles, ArrowRight, ShieldCheck, UserCheck, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AnnouncementModalProps {
  isOpen: boolean
  type: 'account_created' | 'signed_in' | 'signed_out'
  userName?: string
  subtitle?: string
  redirectUrl?: string
}

export default function AnnouncementModal({
  isOpen,
  type,
  userName = 'Creator',
  subtitle,
  redirectUrl,
}: AnnouncementModalProps) {
  const targetDestination = redirectUrl || (type === 'signed_out' ? '/' : '/dashboard')

  useEffect(() => {
    if (isOpen) {
      // Auto-navigate after 1.2s via window.location.href to guarantee instant page load
      const timer = setTimeout(() => {
        window.location.href = targetDestination
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [isOpen, targetDestination])

  if (!isOpen) return null

  const handleImmediateNavigate = () => {
    window.location.href = targetDestination
  }

  const content = {
    account_created: {
      badge: 'Account Created',
      title: '🎉 Welcome to CreatorForge!',
      desc: `Your profile for ${userName} has been created successfully.`,
      icon: Sparkles,
      iconColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      buttonText: 'Enter Dashboard Now',
    },
    signed_in: {
      badge: 'Authentication Verified',
      title: `⚡ Welcome Back, ${userName}!`,
      desc: 'Signed in successfully. Your workspace is ready.',
      icon: UserCheck,
      iconColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
      buttonText: 'Go to Dashboard',
    },
    signed_out: {
      badge: 'Signed Out',
      title: '👋 See You Soon!',
      desc: 'You have been safely signed out of CreatorForge.',
      icon: LogOut,
      iconColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      buttonText: 'Return Home',
    },
  }[type]

  const Icon = content.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-sm glass-card border border-primary/40 rounded-3xl p-7 text-center shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow ambient background */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-primary/25 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-cyan-500/25 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Animated Icon Circle */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30 flex items-center justify-center mb-4 shadow-inner">
            <Icon className={`w-7 h-7 ${content.iconColor}`} />
          </div>

          {/* Badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-3 ${content.badgeBg}`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{content.badge}</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white mb-2">
            {content.title}
          </h2>

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {subtitle || content.desc}
          </p>

          {/* Direct CTA button to never get stuck */}
          <Button
            onClick={handleImmediateNavigate}
            className="w-full gradient-brand text-white border-0 btn-glow font-semibold py-5 rounded-xl gap-2 shadow-lg mb-3"
          >
            <span>{content.buttonText}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-xs text-muted-foreground/80">
            Redirecting automatically...
          </p>
        </div>
      </div>
    </div>
  )
}
