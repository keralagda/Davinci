import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const plans = await db.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Parse the features JSON string for each plan
    const parsedPlans = plans.map((plan) => ({
      ...plan,
      features: JSON.parse(plan.features),
    }));

    return NextResponse.json({ plans: parsedPlans });
  } catch (error) {
    console.error('Pricing fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing plans' },
      { status: 500 }
    );
  }
}
