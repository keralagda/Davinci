import { NextResponse } from 'next/server';
import { getUsageSummary } from '@/lib/usage';

const DEMO_USER_ID = 'demo-user-001';

export async function GET() {
  try {
    const summary = await getUsageSummary(DEMO_USER_ID);

    if (!summary) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ usage: summary });
  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json({ error: 'Failed to check usage' }, { status: 500 });
  }
}
