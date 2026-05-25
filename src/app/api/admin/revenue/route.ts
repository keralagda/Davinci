import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Active subscriptions with revenue
    const activeSubscriptions = await db.subscription.findMany({
      where: { status: 'active' },
      select: { planType: true, amount: true, startDate: true, userId: true },
    });

    // Calculate MRR
    const mrr = activeSubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);
    const arr = mrr * 12;

    // Plan distribution
    const planCounts = activeSubscriptions.reduce((acc, sub) => {
      acc[sub.planType] = (acc[sub.planType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const planRevenue = activeSubscriptions.reduce((acc, sub) => {
      acc[sub.planType] = (acc[sub.planType] || 0) + (sub.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    // Total users and conversion rate
    const totalUsers = await db.user.count();
    const paidUsers = await db.user.count({
      where: { plan: { not: 'free' } },
    });
    const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;

    // Churn: cancelled subscriptions in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cancelledRecent = await db.subscription.count({
      where: {
        status: 'cancelled',
        endDate: { gte: thirtyDaysAgo },
      },
    });
    const churnRate = activeSubscriptions.length > 0
      ? (cancelledRecent / (activeSubscriptions.length + cancelledRecent)) * 100
      : 0;

    // New subscriptions in last 30 days
    const newSubscriptions = await db.subscription.count({
      where: {
        status: 'active',
        startDate: { gte: thirtyDaysAgo },
      },
    });

    // Average revenue per user (ARPU)
    const arpu = paidUsers > 0 ? mrr / paidUsers : 0;

    // Lifetime value estimate (ARPU / churn rate)
    const ltv = churnRate > 0 ? (arpu / (churnRate / 100)) : arpu * 24;

    // Monthly revenue trend (last 6 months simulated from subscription data)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthSubs = await db.subscription.count({
        where: {
          status: 'active',
          startDate: { lte: monthEnd },
          OR: [
            { endDate: null },
            { endDate: { gte: monthStart } },
          ],
        },
      });

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        subscribers: monthSubs,
        revenue: monthSubs * arpu,
      });
    }

    // Top paying users
    const topUsers = await db.user.findMany({
      where: { plan: { not: 'free' } },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        wordsUsed: true,
        imagesUsed: true,
        chatMessages: true,
        createdAt: true,
      },
      orderBy: { wordsUsed: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      overview: {
        mrr,
        arr,
        totalActive: activeSubscriptions.length,
        totalUsers,
        paidUsers,
        conversionRate: Math.round(conversionRate * 10) / 10,
        churnRate: Math.round(churnRate * 10) / 10,
        newSubscriptions,
        arpu: Math.round(arpu * 100) / 100,
        ltv: Math.round(ltv * 100) / 100,
      },
      planDistribution: Object.entries(planCounts).map(([plan, count]) => ({
        plan,
        count,
        revenue: planRevenue[plan] || 0,
      })),
      monthlyTrend,
      topUsers,
    });
  } catch (error) {
    console.error('Admin revenue error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
  }
}
