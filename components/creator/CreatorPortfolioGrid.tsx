'use client'

import { useState } from 'react'
import { ImageIcon, Video, ChevronDown, ChevronUp, Shield } from 'lucide-react'
import type { PortfolioItem } from '@/types/database'

interface Props {
  items: PortfolioItem[]
}

export default function CreatorPortfolioGrid({ items }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map(item => (
        <div
          key={item.id}
          className="glass-card rounded-xl border border-border/50 overflow-hidden group"
        >
          {/* Media preview */}
          <div className="relative aspect-video bg-muted/50 flex items-center justify-center overflow-hidden">
            {item.media_url ? (
              item.media_type === 'video' ? (
                <video
                  src={item.media_url}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  muted
                  loop
                  onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                  onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0 }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.media_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                {item.media_type === 'video' ? <Video className="w-10 h-10" /> : <ImageIcon className="w-10 h-10" />}
                <span className="text-xs capitalize">{item.media_type}</span>
              </div>
            )}

            {/* Overlays */}
            <div className="absolute top-2 left-2 flex gap-2">
              {item.is_featured && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/30 text-amber-400 border border-amber-500/40 backdrop-blur-sm">
                  Featured
                </span>
              )}
              {item.is_verified && (
                <span className="verified-badge backdrop-blur-sm">
                  <Shield className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>

            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-black/50 text-white/80 backdrop-blur-sm capitalize">
                {item.media_type}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h4 className="font-semibold mb-1 truncate">{item.title}</h4>

            {item.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
            )}

            {/* Tools */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.tools_used.map(tool => (
                <span key={tool} className="tag-pill">{tool}</span>
              ))}
            </div>

            {/* Workflow notes toggle */}
            {item.workflow_notes && (
              <div>
                <button
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  {expandedId === item.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  Workflow Notes
                </button>

                {expandedId === item.id && (
                  <div className="mt-2 p-3 rounded-lg bg-muted/40 border border-border/50 animate-scale-in">
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {item.workflow_notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
