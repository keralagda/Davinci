import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Total users
    const totalUsers = await db.user.count()

    // Active users (users with activity)
    const activeUsers = await db.user.count({
      where: {
        OR: [
          { wordsUsed: { gt: 0 } },
          { imagesUsed: { gt: 0 } },
          { chatMessages: { gt: 0 } },
          { codeGenerated: { gt: 0 } },
        ],
      },
    })

    // Total documents generated
    const totalDocuments = await db.generatedDoc.count()
    const totalImages = await db.imageGeneration.count()
    const totalCodeGens = await db.codeGeneration.count()
    const totalConversations = await db.conversation.count()
    const totalTranscriptions = await db.transcription.count()
    const totalTTS = await db.tTSGeneration.count()

    // Revenue (mock calculation based on plan distribution)
    const planDistribution = await db.user.groupBy({
      by: ['plan'],
      _count: { plan: true },
    })

    const planPrices: Record<string, number> = {
      free: 0,
      starter: 9.99,
      professional: 29.99,
      monthly: 29.99,
      yearly: 299.99,
      enterprise: 99.99,
      lifetime: 499.99,
      prepaid: 0,
    }

    let monthlyRevenue = 0
    planDistribution.forEach((p) => {
      monthlyRevenue += (planPrices[p.plan] || 0) * p._count.plan
    })

    // Subscription stats
    const activeSubscriptions = await db.subscription.count({
      where: { status: 'active' },
    })

    // Recent signups (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentSignups = await db.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    })

    // Resource usage totals
    const totalWordsUsed = await db.user.aggregate({ _sum: { wordsUsed: true } })
    const totalImagesUsed = await db.user.aggregate({ _sum: { imagesUsed: true } })
    const totalChatMessages = await db.user.aggregate({ _sum: { chatMessages: true } })
    const totalCodeGenerated = await db.user.aggregate({ _sum: { codeGenerated: true } })

    // Template usage
    const templateStats = await db.generatedDoc.groupBy({
      by: ['templateId'],
      _count: { templateId: true },
      orderBy: { _count: { templateId: 'desc' } },
      take: 10,
    })

    // Get template names for the top templates
    const topTemplates = await Promise.all(
      templateStats.map(async (stat) => {
        if (!stat.templateId) return { name: 'Custom', count: stat._count.templateId }
        const template = await db.template.findUnique({
          where: { id: stat.templateId },
          select: { name: true },
        })
        return {
          name: template?.name || 'Unknown',
          count: stat._count.templateId,
        }
      })
    )

    // Daily activity (last 7 days)
    const dailyActivity = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const docs = await db.generatedDoc.count({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
      })
      const convos = await db.conversation.count({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
      })
      const images = await db.imageGeneration.count({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
      })

      dailyActivity.push({
        day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dayStart.toISOString().split('T')[0],
        documents: docs,
        conversations: convos,
        images,
      })
    }

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        recentSignups,
      },
      content: {
        totalDocuments,
        totalImages,
        totalCodeGens,
        totalConversations,
        totalTranscriptions,
        totalTTS,
      },
      revenue: {
        monthly: monthlyRevenue,
        activeSubscriptions,
        planDistribution: planDistribution.map((p) => ({
          plan: p.plan,
          count: p._count.plan,
        })),
      },
      usage: {
        totalWords: totalWordsUsed._sum.wordsUsed || 0,
        totalImages: totalImagesUsed._sum.imagesUsed || 0,
        totalChat: totalChatMessages._sum.chatMessages || 0,
        totalCode: totalCodeGenerated._sum.codeGenerated || 0,
      },
      topTemplates,
      dailyActivity,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 })
  }
}
