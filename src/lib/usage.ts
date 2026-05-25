import { db } from '@/lib/db';

// Plan limits (0 = unlimited)
const PLAN_LIMITS: Record<string, {
  wordsLimit: number;
  imagesLimit: number;
  chatMessagesLimit: number;
  codeLimit: number;
  audioMinutesLimit: number;
}> = {
  free: { wordsLimit: 5000, imagesLimit: 10, chatMessagesLimit: 50, codeLimit: 20, audioMinutesLimit: 5 },
  starter: { wordsLimit: 25000, imagesLimit: 50, chatMessagesLimit: 200, codeLimit: 100, audioMinutesLimit: 30 },
  professional: { wordsLimit: 100000, imagesLimit: 200, chatMessagesLimit: 0, codeLimit: 0, audioMinutesLimit: 120 },
  enterprise: { wordsLimit: 0, imagesLimit: 0, chatMessagesLimit: 0, codeLimit: 0, audioMinutesLimit: 0 },
  lifetime: { wordsLimit: 0, imagesLimit: 0, chatMessagesLimit: 0, codeLimit: 0, audioMinutesLimit: 0 },
};

export type UsageType = 'words' | 'images' | 'chat' | 'code' | 'audio';

interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  plan: string;
}

/**
 * Check if a user has remaining usage for a given type
 */
export async function checkUsage(userId: string, type: UsageType): Promise<UsageCheckResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      wordsUsed: true,
      imagesUsed: true,
      chatMessages: true,
      codeGenerated: true,
      audioMinutes: true,
    },
  });

  if (!user) {
    return { allowed: false, current: 0, limit: 0, remaining: 0, plan: 'free' };
  }

  // Check for custom subscription limits first
  const subscription = await db.subscription.findFirst({
    where: { userId, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });

  const planLimits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;

  let current: number;
  let limit: number;

  switch (type) {
    case 'words':
      current = user.wordsUsed;
      limit = subscription?.wordsLimit ?? planLimits.wordsLimit;
      break;
    case 'images':
      current = user.imagesUsed;
      limit = subscription?.imagesLimit ?? planLimits.imagesLimit;
      break;
    case 'chat':
      current = user.chatMessages;
      limit = subscription?.chatMessagesLimit ?? planLimits.chatMessagesLimit;
      break;
    case 'code':
      current = user.codeGenerated;
      limit = subscription?.codeLimit ?? planLimits.codeLimit;
      break;
    case 'audio':
      current = user.audioMinutes;
      limit = subscription?.audioMinutesLimit ?? planLimits.audioMinutesLimit;
      break;
  }

  // 0 means unlimited
  const allowed = limit === 0 || current < limit;
  const remaining = limit === 0 ? Infinity : Math.max(0, limit - current);

  return { allowed, current, limit, remaining, plan: user.plan };
}

/**
 * Get full usage summary for a user
 */
export async function getUsageSummary(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      wordsUsed: true,
      imagesUsed: true,
      chatMessages: true,
      codeGenerated: true,
      audioMinutes: true,
    },
  });

  if (!user) return null;

  const subscription = await db.subscription.findFirst({
    where: { userId, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });

  const planLimits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;

  return {
    plan: user.plan,
    words: {
      used: user.wordsUsed,
      limit: subscription?.wordsLimit ?? planLimits.wordsLimit,
      percentage: planLimits.wordsLimit === 0 ? 0 : Math.round((user.wordsUsed / (subscription?.wordsLimit ?? planLimits.wordsLimit)) * 100),
    },
    images: {
      used: user.imagesUsed,
      limit: subscription?.imagesLimit ?? planLimits.imagesLimit,
      percentage: planLimits.imagesLimit === 0 ? 0 : Math.round((user.imagesUsed / (subscription?.imagesLimit ?? planLimits.imagesLimit)) * 100),
    },
    chat: {
      used: user.chatMessages,
      limit: subscription?.chatMessagesLimit ?? planLimits.chatMessagesLimit,
      percentage: planLimits.chatMessagesLimit === 0 ? 0 : Math.round((user.chatMessages / (subscription?.chatMessagesLimit ?? planLimits.chatMessagesLimit)) * 100),
    },
    code: {
      used: user.codeGenerated,
      limit: subscription?.codeLimit ?? planLimits.codeLimit,
      percentage: planLimits.codeLimit === 0 ? 0 : Math.round((user.codeGenerated / (subscription?.codeLimit ?? planLimits.codeLimit)) * 100),
    },
    audio: {
      used: user.audioMinutes,
      limit: subscription?.audioMinutesLimit ?? planLimits.audioMinutesLimit,
      percentage: planLimits.audioMinutesLimit === 0 ? 0 : Math.round((user.audioMinutes / (subscription?.audioMinutesLimit ?? planLimits.audioMinutesLimit)) * 100),
    },
  };
}

/**
 * Increment usage for a user
 */
export async function incrementUsage(userId: string, type: UsageType, amount: number = 1) {
  const updateData: Record<string, { increment: number }> = {};

  switch (type) {
    case 'words':
      updateData.wordsUsed = { increment: amount };
      break;
    case 'images':
      updateData.imagesUsed = { increment: amount };
      break;
    case 'chat':
      updateData.chatMessages = { increment: amount };
      break;
    case 'code':
      updateData.codeGenerated = { increment: amount };
      break;
    case 'audio':
      updateData.audioMinutes = { increment: amount };
      break;
  }

  return db.user.update({
    where: { id: userId },
    data: updateData,
  });
}
