import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CreatorForge — AI Creative Marketplace',
  description:
    'Connect with elite AI content creators — filmmakers, animators, and generative artists — for your next campaign. CreatorForge is the premier marketplace for AI-generated creative work.',
  keywords: 'AI creators, generative art, AI filmmakers, AI animation, brand campaigns, creative marketplace',
  openGraph: {
    title: 'CreatorForge — AI Creative Marketplace',
    description: 'Connect with elite AI content creators for your next campaign.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
