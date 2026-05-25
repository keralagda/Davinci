import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEMO_USER_ID = 'demo-user-001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const skip = (page - 1) * limit;

    const images = await db.imageGeneration.findMany({
      where: {
        userId: DEMO_USER_ID,
        status: 'completed',
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await db.imageGeneration.count({
      where: {
        userId: DEMO_USER_ID,
        status: 'completed',
      },
    });

    return NextResponse.json({
      images: images.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        prompt: img.prompt,
        negativePrompt: img.negativePrompt,
        size: img.size,
        quality: img.quality,
        style: img.style,
        status: img.status,
        createdAt: img.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Images fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}
