export interface ChatMessage {
  id: string
  sender: 'brand' | 'creator' | 'user'
  text: string
  media_url?: string
  timestamp: string
}

export interface ChatThread {
  id: string
  creator_id: string
  creator_name: string
  creator_avatar?: string
  brand_id: string
  brand_name: string
  brand_company?: string
  last_message?: string
  updated_at: string
  unread_count: number
  messages: ChatMessage[]
}

const STORAGE_KEY = 'creatorforge_chat_threads'

// Default sample conversations so creator or brand can immediately see realistic chats
const SEED_THREADS: ChatThread[] = [
  {
    id: 'thread-seed-1',
    creator_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Alex Rivera
    creator_name: 'Alex Rivera',
    creator_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    brand_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    brand_name: 'Apex Studios',
    brand_company: 'Apex Media Corp',
    last_message: 'Hi Alex, loved your Cyberpunk work! Are you available for a 3-week brand campaign?',
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    unread_count: 1,
    messages: [
      {
        id: 'msg-1',
        sender: 'brand',
        text: 'Hi Alex, loved your Cyberpunk portfolio piece! We are planning a 30s cinematic commercial.',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'msg-2',
        sender: 'creator',
        text: 'Thanks! I specialize in Midjourney v6 + Runway Gen-3 workflows. What timeline are you aiming for?',
        timestamp: new Date(Date.now() - 5400000).toISOString(),
      },
      {
        id: 'msg-3',
        sender: 'brand',
        text: 'Are you available for a 3-week brand campaign starting this month? Budget is around $3,500.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  },
]

export function getStoredThreads(): ChatThread[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_THREADS))
    return SEED_THREADS
  }
  try {
    return JSON.parse(raw) as ChatThread[]
  } catch {
    return SEED_THREADS
  }
}

export function saveStoredThreads(threads: ChatThread[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads))
}

export function getThreadsForUser(role: 'brand' | 'creator', userId?: string): ChatThread[] {
  const threads = getStoredThreads()
  // Return threads relevant to the user or all if demo
  return threads.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
}

export function getOrCreateThread(
  creator: { id: string; name: string; avatar?: string },
  brand: { id: string; name: string }
): ChatThread {
  const threads = getStoredThreads()
  const existing = threads.find(
    t => t.creator_id === creator.id && t.brand_id === brand.id
  ) || threads.find(t => t.creator_id === creator.id)

  if (existing) {
    return existing
  }

  const newThread: ChatThread = {
    id: `thread-${Date.now()}`,
    creator_id: creator.id,
    creator_name: creator.name,
    creator_avatar: creator.avatar,
    brand_id: brand.id,
    brand_name: brand.name,
    last_message: 'Conversation started',
    updated_at: new Date().toISOString(),
    unread_count: 0,
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: 'brand',
        text: `Hi ${creator.name}! I would love to discuss a potential campaign collaboration before onboarding you.`,
        timestamp: new Date().toISOString(),
      },
    ],
  }

  saveStoredThreads([newThread, ...threads])
  return newThread
}

export function sendChatMessage(
  threadId: string,
  sender: 'brand' | 'creator' | 'user',
  text: string,
  mediaUrl?: string
): ChatThread | null {
  const threads = getStoredThreads()
  const threadIndex = threads.findIndex(t => t.id === threadId)
  if (threadIndex === -1) return null

  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    sender,
    text,
    media_url: mediaUrl,
    timestamp: new Date().toISOString(),
  }

  const updatedThread: ChatThread = {
    ...threads[threadIndex],
    messages: [...threads[threadIndex].messages, newMessage],
    last_message: text || (mediaUrl ? 'Shared an image' : ''),
    updated_at: new Date().toISOString(),
  }

  threads[threadIndex] = updatedThread
  saveStoredThreads(threads)
  return updatedThread
}

export function addIncomingReply(
  threadId: string,
  sender: 'creator' | 'brand',
  text: string,
  mediaUrl?: string
): ChatThread | null {
  return sendChatMessage(threadId, sender, text, mediaUrl)
}
