import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const getSupabaseCredentials = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const validUrl = url && url.startsWith('http') ? url : 'https://placeholder-project.supabase.co'
  const validKey = key || 'placeholder-key'
  return { url: validUrl, key: validKey }
}

export async function createClient() {
  const cookieStore = await cookies()
  const { url, key } = getSupabaseCredentials()

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies can't be set here
          }
        },
      },
    }
  )
}

