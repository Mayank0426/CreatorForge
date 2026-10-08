import { NextRequest, NextResponse } from 'next/server'

const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
]

export async function POST(request: NextRequest) {
  const { prompt } = await request.json()

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY || ''

  const systemPrompt = `You are a creative brief structuring assistant for an AI creative marketplace called CreatorForge.
The user has described their campaign idea in plain language. Extract and structure the following fields as a JSON object:

- title: string (short, compelling brief title, max 80 chars)
- campaign_description: string (expanded, professional description of the campaign, 2-3 sentences)
- content_type: one of ["video", "image", "animation", "other"]
- style_tags: string[] (2-5 style descriptors from: Cinematic, 3D, Anime, Realistic, Abstract, Vintage, Futuristic, Minimalist, Luxury, Dark & Moody, Bright & Colorful, Surreal, Documentary, Product-focused)
- aspect_ratio: one of ["16:9", "9:16", "1:1", "other"]
- commercial_use_type: one of ["internal-only", "limited-commercial", "full-commercial", "resale"]

Return ONLY valid JSON. No markdown, no explanation.

User's idea: "${prompt}"`

  if (apiKey) {
    for (const model of GEMINI_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 600,
              },
            }),
          }
        )

        if (response.ok) {
          const data = await response.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
          const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          const parsed = JSON.parse(cleanText)
          return NextResponse.json(parsed)
        }
      } catch {
        // try next model
      }
    }
  }

  // Fallback intelligent brief generation if offline or rate limited
  return NextResponse.json({
    title: prompt.length > 50 ? prompt.slice(0, 47) + '...' : prompt,
    campaign_description: `High-impact campaign focused on: ${prompt}. Designed for modern digital audience with premium visual execution.`,
    content_type: prompt.toLowerCase().includes('video') ? 'video' : 'image',
    style_tags: ['Cinematic', 'Futuristic', 'Product-focused'],
    aspect_ratio: '16:9',
    commercial_use_type: 'full-commercial',
  })
}
