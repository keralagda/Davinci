import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const plans = await db.pricingPlan.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const parsedPlans = plans.map((plan) => ({
      ...plan,
      features: JSON.parse(plan.features),
    }));

    return NextResponse.json({ plans: parsedPlans });
  } catch (error) {
    console.error('Admin plans fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, slug, description, price, currency, interval,
      wordsLimit, imagesLimit, chatMessagesLimit, codeLimit, audioMinutesLimit,
      features, isPopular, isActive, sortOrder,
    } = body;

    if (!name || !slug || price === undefined) {
      return NextResponse.json({ error: 'name, slug, and price are required' }, { status: 400 });
    }

    const plan = await db.pricingPlan.create({
      data: {
        name,
        slug,
        description: description || '',
        price,
        currency: currency || 'USD',
        interval: interval || 'monthly',
        wordsLimit: wordsLimit || 0,
        imagesLimit: imagesLimit || 0,
        chatMessagesLimit: chatMessagesLimit || 0,
        codeLimit: codeLimit || 0,
        audioMinutesLimit: audioMinutesLimit || 0,
        features: JSON.stringify(features || []),
        isPopular: isPopular || false,
        isActive: isActive !== false,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error('Admin plan create error:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Plan id is required' }, { status: 400 });
    }

    // If features is an array, stringify it
    if (Array.isArray(data.features)) {
      data.features = JSON.stringify(data.features);
    }

    const plan = await db.pricingPlan.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error('Admin plan update error:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Plan id is required' }, { status: 400 });
    }

    await db.pricingPlan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin plan delete error:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
