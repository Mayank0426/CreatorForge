import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, name, role = 'creator', avatar_url } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const cleanEmail = String(email).trim().toLowerCase()
    const cleanName = String(name || cleanEmail.split('@')[0]).trim()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle()

    let finalUser = existingUser

    if (!finalUser) {
      // Generate a new UUID
      const newUserId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'u-' + Date.now()

      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: newUserId,
          email: cleanEmail,
          name: cleanName,
          role,
          avatar_url: avatar_url || null,
          onboarding_complete: true,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to insert user to Supabase:', insertError)
        // If conflict on email, re-fetch
        const { data: refetched } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle()
        finalUser = refetched
      } else {
        finalUser = insertedUser
      }
    } else {
      // Update role/name if changed
      const { data: updatedUser } = await supabase
        .from('users')
        .update({
          name: cleanName,
          role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', finalUser.id)
        .select()
        .single()

      if (updatedUser) finalUser = updatedUser
    }

    if (!finalUser) {
      return NextResponse.json({
        error: 'Failed to persist user in Supabase',
        fallbackUser: {
          id: 'u-' + Date.now(),
          email: cleanEmail,
          name: cleanName,
          role,
        }
      }, { status: 500 })
    }

    // 2. If creator, ensure creator_profiles row exists
    let finalProfile = null
    if (role === 'creator') {
      const { data: existingProfile } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', finalUser.id)
        .maybeSingle()

      if (existingProfile) {
        finalProfile = existingProfile
      } else {
        const newProfileId = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'cp-' + Date.now()

        const { data: insertedProfile } = await supabase
          .from('creator_profiles')
          .insert({
            id: newProfileId,
            user_id: finalUser.id,
            headline: 'AI Visual Director & Generative Creator',
            bio: 'Creator crafting high-end generative media, synthetic cinematography, and brand visuals.',
            specializations: ['Brand Films', 'Product Ads', '3D Motion'],
            skills: ['Prompt Engineering', 'Motion Design', 'Color Grading'],
            tools_used: ['Runway Gen-3', 'Midjourney v6', 'ComfyUI'],
            portfolio_links: [],
            verification_status: 'unverified',
            rating: 5.0,
            completed_projects_count: 0,
          })
          .select()
          .single()

        finalProfile = insertedProfile
      }
    }

    return NextResponse.json({
      success: true,
      user: finalUser,
      profile: finalProfile,
    })
  } catch (err: unknown) {
    console.error('Error syncing user:', err)
    return NextResponse.json({ error: 'Internal server error syncing user' }, { status: 500 })
  }
}
