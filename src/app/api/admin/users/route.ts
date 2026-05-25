import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const plan = searchParams.get('plan') || ''

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }
    if (role) where.role = role
    if (plan) where.plan = plan

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          plan: true,
          wordsUsed: true,
          imagesUsed: true,
          chatMessages: true,
          codeGenerated: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              generatedDocs: true,
              conversations: true,
              imageGens: true,
              codeGens: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 })
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'activate':
        updateData = { isActive: true }
        break
      case 'deactivate':
        updateData = { isActive: false }
        break
      case 'set_admin':
        updateData = { role: 'admin' }
        break
      case 'set_user':
        updateData = { role: 'user' }
        break
      case 'set_plan':
        updateData = { plan: body.plan || 'free' }
        break
      case 'reset_usage':
        updateData = { wordsUsed: 0, imagesUsed: 0, chatMessages: 0, codeGenerated: 0, audioMinutes: 0 }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Delete user and all related data
    await db.favorite.deleteMany({ where: { userId } })
    await db.notification.deleteMany({ where: { userId } })
    await db.subscription.deleteMany({ where: { userId } })
    await db.generatedDoc.deleteMany({ where: { userId } })
    await db.imageGeneration.deleteMany({ where: { userId } })
    await db.codeGeneration.deleteMany({ where: { userId } })
    await db.transcription.deleteMany({ where: { userId } })
    await db.tTSGeneration.deleteMany({ where: { userId } })
    await db.message.deleteMany({
      where: { conversation: { userId } },
    })
    await db.conversation.deleteMany({ where: { userId } })
    await db.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin user delete error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
