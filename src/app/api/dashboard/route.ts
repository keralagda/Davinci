import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEMO_USER_ID = 'demo-user-001';

// Plan limits mapping
const PLAN_LIMITS: Record<string, { wordsLimit: number; imagesLimit: number; chatMessagesLimit: number; codeLimit: number }> = {
  free: { wordsLimit: 1000, imagesLimit: 5, chatMessagesLimit: 20, codeLimit: 10 },
  starter: { wordsLimit: 50000, imagesLimit: 50, chatMessagesLimit: 500, codeLimit: 100 },
  monthly: { wordsLimit: 200000, imagesLimit: 200, chatMessagesLimit: 5000, codeLimit: 500 },
  yearly: { wordsLimit: 200000, imagesLimit: 200, chatMessagesLimit: 5000, codeLimit: 500 },
  professional: { wordsLimit: 200000, imagesLimit: 200, chatMessagesLimit: 5000, codeLimit: 500 },
  enterprise: { wordsLimit: 0, imagesLimit: 0, chatMessagesLimit: 0, codeLimit: 0 }, // 0 = unlimited
  lifetime: { wordsLimit: 0, imagesLimit: 0, chatMessagesLimit: 0, codeLimit: 0 },
  prepaid: { wordsLimit: 50000, imagesLimit: 50, chatMessagesLimit: 500, codeLimit: 100 },
};

function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS['free'];
}

// Generate mock daily usage data for the past 7 days
function generateDailyUsage() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const data = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      day: days[date.getDay()],
      date: date.toISOString().split('T')[0],
      words: Math.floor(Math.random() * 2500) + 500,
      chats: Math.floor(Math.random() * 30) + 5,
      code: Math.floor(Math.random() * 15) + 2,
    });
  }

  return data;
}

export async function GET() {
  try {
    // Get user stats
    const user = await db.user.findUnique({
      where: { id: DEMO_USER_ID },
    });

    if (!user) {
      // Create demo user if not exists
      const newUser = await db.user.create({
        data: {
          id: DEMO_USER_ID,
          email: 'demo@davinci.ai',
          name: 'Demo User',
          plan: 'free',
        },
      });

      const limits = getPlanLimits(newUser.plan);

      return NextResponse.json({
        stats: {
          wordsUsed: newUser.wordsUsed,
          wordsLimit: limits.wordsLimit,
          imagesUsed: newUser.imagesUsed,
          imagesLimit: limits.imagesLimit,
          chatMessages: newUser.chatMessages,
          chatMessagesLimit: limits.chatMessagesLimit,
          codeGenerated: newUser.codeGenerated,
          codeLimit: limits.codeLimit,
          audioMinutes: newUser.audioMinutes,
          plan: newUser.plan,
          balance: newUser.balance,
        },
        totals: {
          documents: 0,
          conversations: 0,
          images: 0,
          codeGenerations: 0,
          transcriptions: 0,
          ttsGenerations: 0,
        },
        recentActivity: {
          documents: [],
          conversations: [],
          images: [],
          codeGens: [],
        },
        dailyUsage: generateDailyUsage(),
      });
    }

    // Get recent activity
    const [recentDocs, recentConversations, recentImages, recentCode] = await Promise.all([
      db.generatedDoc.findMany({
        where: { userId: DEMO_USER_ID },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { template: { select: { name: true, icon: true } } },
      }),
      db.conversation.findMany({
        where: { userId: DEMO_USER_ID },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      db.imageGeneration.findMany({
        where: { userId: DEMO_USER_ID },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      db.codeGeneration.findMany({
        where: { userId: DEMO_USER_ID },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Get totals
    const [
      totalDocs,
      totalConversations,
      totalImages,
      totalCode,
      totalTranscriptions,
      totalTTS,
    ] = await Promise.all([
      db.generatedDoc.count({ where: { userId: DEMO_USER_ID } }),
      db.conversation.count({ where: { userId: DEMO_USER_ID } }),
      db.imageGeneration.count({ where: { userId: DEMO_USER_ID } }),
      db.codeGeneration.count({ where: { userId: DEMO_USER_ID } }),
      db.transcription.count({ where: { userId: DEMO_USER_ID } }),
      db.tTSGeneration.count({ where: { userId: DEMO_USER_ID } }),
    ]);

    const limits = getPlanLimits(user.plan);

    return NextResponse.json({
      stats: {
        wordsUsed: user.wordsUsed,
        wordsLimit: limits.wordsLimit,
        imagesUsed: user.imagesUsed,
        imagesLimit: limits.imagesLimit,
        chatMessages: user.chatMessages,
        chatMessagesLimit: limits.chatMessagesLimit,
        codeGenerated: user.codeGenerated,
        codeLimit: limits.codeLimit,
        audioMinutes: user.audioMinutes,
        plan: user.plan,
        balance: user.balance,
      },
      totals: {
        documents: totalDocs,
        conversations: totalConversations,
        images: totalImages,
        codeGenerations: totalCode,
        transcriptions: totalTranscriptions,
        ttsGenerations: totalTTS,
      },
      recentActivity: {
        documents: recentDocs.map((d) => ({
          id: d.id,
          title: d.title,
          templateName: d.template?.name ?? null,
          templateIcon: d.template?.icon ?? null,
          wordsCount: d.wordsCount,
          createdAt: d.createdAt,
          type: 'document',
        })),
        conversations: recentConversations.map((c) => ({
          id: c.id,
          title: c.title,
          assistantType: c.assistantType,
          updatedAt: c.updatedAt,
          lastMessage: c.messages[0]?.content ?? null,
          type: 'conversation',
        })),
        images: recentImages.map((img) => ({
          id: img.id,
          prompt: img.prompt,
          size: img.size,
          status: img.status,
          imageUrl: img.imageUrl,
          createdAt: img.createdAt,
          type: 'image',
        })),
        codeGens: recentCode.map((c) => ({
          id: c.id,
          prompt: c.prompt,
          language: c.language,
          createdAt: c.createdAt,
          type: 'code',
        })),
      },
      dailyUsage: generateDailyUsage(),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
