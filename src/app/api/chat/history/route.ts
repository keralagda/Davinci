import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEMO_USER_ID = 'demo-user-001';

export async function GET() {
  try {
    const conversations = await db.conversation.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const result = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      assistantType: conv.assistantType,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      lastMessage: conv.messages[0]?.content ?? null,
      lastMessageAt: conv.messages[0]?.createdAt ?? null,
    }));

    return NextResponse.json({ conversations: result });
  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}
