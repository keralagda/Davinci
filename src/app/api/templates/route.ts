import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const isPremium = searchParams.get('isPremium');

    // Build filter conditions
    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isPremium !== null && isPremium !== undefined) {
      where.isPremium = isPremium === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const templates = await db.template.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Templates fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
