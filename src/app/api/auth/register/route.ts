import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create user (in production, hash the password with bcrypt)
    const user = await db.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password, // TODO: hash with bcrypt in production
        role: 'user',
        plan: 'free',
      },
    });

    // Create a free subscription
    await db.subscription.create({
      data: {
        userId: user.id,
        planType: 'free',
        status: 'active',
        wordsLimit: 5000,
        imagesLimit: 10,
        chatMessagesLimit: 50,
        codeLimit: 20,
        audioMinutesLimit: 5,
        startDate: new Date(),
      },
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name || email.split('@')[0]).catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
      },
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
