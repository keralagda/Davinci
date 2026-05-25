import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEMO_USER_ID = 'demo-user-001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const favorite = searchParams.get('favorite');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '12', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      userId: DEMO_USER_ID,
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { output: { contains: search } },
      ];
    }

    if (type && type !== 'all') {
      where.template = { outputType: type };
    }

    if (favorite === 'true') {
      where.isFavorite = true;
    }

    // Build order by
    let orderBy: Record<string, string>;
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'a-z':
        orderBy = { title: 'asc' };
        break;
      case 'most-words':
        orderBy = { wordsCount: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const documents = await db.generatedDoc.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            outputType: true,
            icon: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const total = await db.generatedDoc.count({ where });

    return NextResponse.json({
      documents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Documents fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isFavorite } = body;

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

    const doc = await db.generatedDoc.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error('Document update error:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    await db.generatedDoc.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Document delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
