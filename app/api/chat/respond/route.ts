import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      threadId,
      creatorId,
      creatorName = 'Creator',
      senderName = 'User',
      senderRole = 'brand',
      messageText = '',
      mediaUrl = null,
    } = body

    if (!messageText && !mediaUrl) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Ensure thread exists in Supabase
    let finalThreadId = threadId
    const isValidUuid = (id?: string | null) =>
      Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))

    if (!isValidUuid(finalThreadId)) {
      const { data: newThread } = await supabase
        .from('chat_threads')
        .insert({
          creator_id: creatorId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          creator_name: creatorName,
          brand_id: 'brand-user',
          brand_name: senderName,
          last_message: messageText || 'Sent an attachment',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (newThread?.id) finalThreadId = newThread.id
    }

    // Insert message to Supabase chat_messages
    let userMsgRecord = null
    if (isValidUuid(finalThreadId)) {
      const { data: uMsg } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: finalThreadId,
          sender_role: senderRole === 'creator' ? 'creator' : 'brand',
          sender_name: senderName,
          text: messageText,
          media_url: mediaUrl,
        })
        .select()
        .single()
      userMsgRecord = uMsg

      // Update thread last_message and last_message_at
      await supabase
        .from('chat_threads')
        .update({
          last_message: messageText || (mediaUrl ? 'Shared an image' : ''),
          last_message_at: new Date().toISOString(),
        })
        .eq('id', finalThreadId)
    }

    // Pure 2-way conversation: No automated Gemini bot replies
    return NextResponse.json({
      success: true,
      threadId: finalThreadId,
      userMessage: userMsgRecord || {
        id: 'msg-' + Date.now(),
        sender_role: senderRole,
        sender_name: senderName,
        text: messageText,
        media_url: mediaUrl,
        created_at: new Date().toISOString(),
      },
    })
  } catch (err: unknown) {
    console.error('Chat send API error:', err)
    return NextResponse.json({ error: 'Failed to send chat message' }, { status: 500 })
  }
}
