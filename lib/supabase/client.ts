import { createBrowserClient } from '@supabase/ssr'

const getSupabaseCredentials = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const validUrl = url && url.startsWith('http') ? url : 'https://placeholder-project.supabase.co'
  const validKey = key || 'placeholder-key'
  return { url: validUrl, key: validKey }
}

export function createClient() {
  const { url, key } = getSupabaseCredentials()
  return createBrowserClient(url, key)
}

