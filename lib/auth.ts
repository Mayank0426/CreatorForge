import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/database'

export async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgUint8 = new TextEncoder().encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  return btoa(password)
}

export interface StoredUser {
  id: string
  email: string
  name: string
  role: UserRole
  onboarding_complete?: boolean
}

export function setActiveSession(user: StoredUser) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('creatorforge_user', JSON.stringify(user))
    document.cookie = `creatorforge_user_id=${user.id}; path=/; max-age=604800; SameSite=Lax`
  }
}

export function clearActiveSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('creatorforge_user')
    document.cookie = 'creatorforge_user_id=; path=/; max-age=0'
  }
}

export function getActiveSession(): StoredUser | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('creatorforge_user')
    if (raw) {
      try {
        return JSON.parse(raw) as StoredUser
      } catch {
        return null
      }
    }
  }
  return null
}
