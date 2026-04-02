'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth'

function toISO(date: Date | null): string | null {
  return date ? date.toISOString() : null
}

// ---------------------------------------------------------------------------
// Chat List
// ---------------------------------------------------------------------------

export async function getChatList() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id

  const chatMembers = await prisma.chatMember.findMany({
    where: { userId },
    include: {
      chat: {
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          members: {
            include: {
              user: { select: { id: true, fullName: true, role: true } },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return chatMembers.map((cm) => {
    const partner = cm.chat.members.find((m) => m.userId !== userId)
    const lastMsg = cm.chat.messages[0] ?? null

    return {
      chatId: cm.chat.id,
      isGroup: cm.chat.isGroup,
      chatName: cm.chat.name,
      partnerName: partner?.user.fullName ?? 'Unknown',
      partnerId: partner?.userId ?? null,
      partnerRole: partner?.user.role ?? null,
      lastMessage: lastMsg
        ? {
            content: lastMsg.content,
            createdAt: toISO(lastMsg.createdAt),
            isMine: lastMsg.senderId === userId,
          }
        : null,
      createdAt: toISO(cm.chat.createdAt),
    }
  })
}

// ---------------------------------------------------------------------------
// Chat Messages
// ---------------------------------------------------------------------------

export async function getChatMessages(chatId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id

  // Verify user is a member of this chat
  const membership = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
  })

  if (!membership) throw new Error('Access denied')

  const messages = await prisma.message.findMany({
    where: { chatId },
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return messages.map((msg) => ({
    id: msg.id,
    senderId: msg.senderId,
    senderName: msg.sender.fullName,
    senderRole: msg.sender.role,
    content: msg.content,
    createdAt: toISO(msg.createdAt),
    isMine: msg.senderId === userId,
  }))
}

// ---------------------------------------------------------------------------
// Start Chat (or return existing one)
// ---------------------------------------------------------------------------

export async function startChat(partnerId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id

  if (userId === partnerId) throw new Error('Cannot chat with yourself')

  // Check if a 1-on-1 chat already exists between these users
  const existingChat = await prisma.chat.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: partnerId } } },
      ],
    },
  })

  if (existingChat) {
    return existingChat.id
  }

  // Create new chat
  const chat = await prisma.chat.create({
    data: {
      isGroup: false,
      members: {
        create: [{ userId }, { userId: partnerId }],
      },
    },
  })

  return chat.id
}

// ---------------------------------------------------------------------------
// Send Message
// ---------------------------------------------------------------------------

export async function sendMessage(chatId: string, content: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id

  // Verify user is a member of this chat
  const membership = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
  })

  if (!membership) throw new Error('Access denied')

  const message = await prisma.message.create({
    data: {
      chatId,
      senderId: userId,
      content,
    },
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
    },
  })

  return {
    id: message.id,
    senderId: message.senderId,
    senderName: message.sender.fullName,
    senderRole: message.sender.role,
    content: message.content,
    createdAt: toISO(message.createdAt),
    isMine: true,
  }
}
