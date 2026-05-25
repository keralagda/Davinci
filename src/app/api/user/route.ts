import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEMO_USER_ID = 'demo-user-001';

export async function GET() {
  try {
    let user = await db.user.findUnique({
      where: { id: DEMO_USER_ID },
    });

    if (!user) {
      // Create demo user if not exists
      user = await db.user.create({
        data: {
          id: DEMO_USER_ID,
          email: 'demo@davinci.ai',
          name: 'Demo User',
          plan: 'free',
        },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        plan: user.plan,
        wordsUsed: user.wordsUsed,
        imagesUsed: user.imagesUsed,
        chatMessages: user.chatMessages,
        codeGenerated: user.codeGenerated,
        audioMinutes: user.audioMinutes,
        balance: user.balance,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user info' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, image, plan } = body;

    // Update user info
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;
    if (plan !== undefined) updateData.plan = plan;

    const user = await db.user.upsert({
      where: { id: DEMO_USER_ID },
      update: updateData,
      create: {
        id: DEMO_USER_ID,
        email: 'demo@davinci.ai',
        name: name ?? 'Demo User',
        image: image ?? null,
        plan: plan ?? 'free',
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        plan: user.plan,
        wordsUsed: user.wordsUsed,
        imagesUsed: user.imagesUsed,
        chatMessages: user.chatMessages,
        codeGenerated: user.codeGenerated,
        audioMinutes: user.audioMinutes,
        balance: user.balance,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user info' },
      { status: 500 }
    );
  }
}
