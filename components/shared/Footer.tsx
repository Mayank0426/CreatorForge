import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-primary/20 border border-primary/30 rounded-lg p-1.5">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-lg">
                <span className="gradient-text">Creator</span>
                <span className="text-foreground">Forge</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              The premier AI creative marketplace connecting visionary AI creators with brands who need extraordinary work.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Platform</h4>
            <ul className="space-y-2">
              {[
                { href: '/search', label: 'Discover Creators' },
                { href: '/briefs', label: 'Browse Briefs' },
                { href: '/auth/signup', label: 'Join as Creator' },
                { href: '/auth/signup', label: 'Post a Brief' },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">AI Tools</h4>
            <ul className="space-y-2">
              {['Runway Gen-3', 'Midjourney v6', 'ElevenLabs', 'Sora', 'Stable Diffusion'].map(tool => (
                <li key={tool}>
                  <span className="text-sm text-muted-foreground">{tool}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 CreatorForge. Built for the AI Creator Economy.
          </p>

        </div>
      </div>
    </footer>
  )
}
