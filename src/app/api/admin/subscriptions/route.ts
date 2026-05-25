import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const planType = searchParams.get('planType') || '';
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (planType) where.planType = planType;

    const [subscriptions, total] = await Promise.all([
      db.subscription.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true, plan: true, isActive: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.subscription.count({ where }),
    ]);

    // Revenue summary
    const activeSubscriptions = await db.subscription.findMany({
      where: { status: 'active' },
      select: { planType: true, amount: true },
    });

    const mrr = activeSubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);
    const arr = mrr * 12;

    const planBreakdown = activeSubscriptions.reduce((acc, sub) => {
      acc[sub.planType] = (acc[sub.planType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      subscriptions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      revenue: {
        mrr,
        arr,
        totalActive: activeSubscriptions.length,
        planBreakdown,
      },
    });
  } catch (error) {
    console.error('Admin subscriptions error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, action, data } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json({ error: 'Missing subscriptionId or action' }, { status: 400 });
    }

    switch (action) {
      case 'cancel': {
        await db.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'cancelled', endDate: new Date() },
        });
        break;
      }
      case 'activate': {
        await db.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'active', endDate: null },
        });
        break;
      }
      case 'extend': {
        const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
        if (sub) {
          const newEnd = new Date(sub.endDate || new Date());
          newEnd.setMonth(newEnd.getMonth() + (data?.months || 1));
          await db.subscription.update({
            where: { id: subscriptionId },
            data: { endDate: newEnd, status: 'active' },
          });
        }
        break;
      }
      case 'change_plan': {
        if (!data?.planType) {
          return NextResponse.json({ error: 'Missing planType' }, { status: 400 });
        }
        await db.subscription.update({
          where: { id: subscriptionId },
          data: { planType: data.planType },
        });
        // Also update user's plan
        const sub = await db.subscription.findUnique({
          where: { id: subscriptionId },
          select: { userId: true },
        });
        if (sub) {
          await db.user.update({
            where: { id: sub.userId },
            data: { plan: data.planType },
          });
        }
        break;
      }
      case 'update_limits': {
        await db.subscription.update({
          where: { id: subscriptionId },
          data: {
            wordsLimit: data?.wordsLimit,
            imagesLimit: data?.imagesLimit,
            chatMessagesLimit: data?.chatMessagesLimit,
            codeLimit: data?.codeLimit,
            audioMinutesLimit: data?.audioMinutesLimit,
          },
        });
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin subscription update error:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planType, amount, wordsLimit, imagesLimit, chatMessagesLimit, codeLimit, audioMinutesLimit } = body;

    if (!userId || !planType) {
      return NextResponse.json({ error: 'Missing userId or planType' }, { status: 400 });
    }

    // Cancel any existing active subscription
    await db.subscription.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'cancelled', endDate: new Date() },
    });

    // Create new subscription
    const subscription = await db.subscription.create({
      data: {
        userId,
        planType,
        status: 'active',
        amount: amount || 0,
        currency: 'USD',
        wordsLimit: wordsLimit || 0,
        imagesLimit: imagesLimit || 0,
        chatMessagesLimit: chatMessagesLimit || 0,
        codeLimit: codeLimit || 0,
        audioMinutesLimit: audioMinutesLimit || 0,
        startDate: new Date(),
      },
    });

    // Update user plan
    await db.user.update({
      where: { id: userId },
      data: { plan: planType },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error('Admin create subscription error:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}
