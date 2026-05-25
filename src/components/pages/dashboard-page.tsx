'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  ImageIcon,
  MessageSquare,
  Code2,
  PenLine,
  Mic,
  Volume2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  Crown,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────

interface DashboardStats {
  wordsUsed: number
  wordsLimit: number
  imagesUsed: number
  imagesLimit: number
  chatMessages: number
  chatMessagesLimit: number
  codeGenerated: number
  codeLimit: number
  audioMinutes: number
  plan: string
  balance: number
}

interface RecentItem {
  id: string
  type: 'document' | 'conversation' | 'image' | 'code'
  title?: string
  templateName?: string
  templateIcon?: string | null
  wordsCount?: number | null
  prompt?: string
  language?: string | null
  assistantType?: string | null
  createdAt?: string
  updatedAt?: string
  size?: string | null
  status?: string | null
}

interface DailyUsageItem {
  day: string
  date: string
  words: number
  chats: number
  code: number
}

interface DashboardData {
  stats: DashboardStats
  totals: {
    documents: number
    conversations: number
    images: number
    codeGenerations: number
    transcriptions: number
    ttsGenerations: number
  }
  recentActivity: {
    documents: RecentItem[]
    conversations: RecentItem[]
    images: RecentItem[]
    codeGens: RecentItem[]
  }
  dailyUsage: DailyUsageItem[]
}

// ─── Animation Variants ───────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
}

// ─── Helpers ──────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString()
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function getPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    free: 'Free',
    starter: 'Starter',
    monthly: 'Professional',
    yearly: 'Professional',
    professional: 'Professional',
    enterprise: 'Enterprise',
    lifetime: 'Lifetime',
    prepaid: 'Prepaid',
  }
  return labels[plan] || plan
}

function isUnlimited(limit: number): boolean {
  return limit === 0
}

// ─── Stat Card Component ─────────────────────────────────────────

interface StatCardProps {
  title: string
  value: number
  limit: number
  icon: React.ReactNode
  gradient: string
  iconBg: string
  changePercent: number
  index: number
}

function StatCard({ title, value, limit, icon, gradient, iconBg, changePercent, index }: StatCardProps) {
  const percentage = isUnlimited(limit) ? Math.min((value / 999999) * 100, 100) : Math.min((value / limit) * 100, 100)
  const isNearLimit = !isUnlimited(limit) && percentage > 80
  const displayLimit = isUnlimited(limit) ? '∞' : formatNumber(limit)

  return (
    <motion.div variants={cardVariants} custom={index}>
      <Card className={`relative overflow-hidden border-0 ${gradient}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className={`flex items-center justify-center size-10 rounded-xl ${iconBg}`}>
              {icon}
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              changePercent >= 0
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-red-500/15 text-red-400'
            }`}>
              {changePercent >= 0 ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {changePercent >= 0 ? '+' : ''}{changePercent}%
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight">{formatNumber(value)}</span>
              <span className="text-xs text-muted-foreground">/ {displayLimit}</span>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <Progress
              value={percentage}
              className={`h-1.5 ${isNearLimit ? '[&>[data-slot=progress-indicator]]:bg-amber-500' : '[&>[data-slot=progress-indicator]]:bg-emerald-500'}`}
            />
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-foreground">
                {percentage.toFixed(1)}% used
              </span>
              {isNearLimit && (
                <span className="text-[10px] text-amber-500 font-medium">Near limit</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="size-10 rounded-xl" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <Card className="border-0">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart and activity skeleton */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-0">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 border-0">
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Chart Custom Tooltip ─────────────────────────────────────────

function CustomChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-border bg-background/95 backdrop-blur-sm px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-foreground mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground">{item.name}:</span>
            <span className="font-medium text-foreground">{item.name === 'Words' ? formatNumber(item.value) : item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Dashboard Page ──────────────────────────────────────────

export function DashboardPage() {
  const { setActivePage, user } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading || !data) {
    return <DashboardSkeleton />
  }

  const { stats, totals, recentActivity, dailyUsage } = data

  // Merge all recent activity into one sorted list
  const allRecent: RecentItem[] = [
    ...recentActivity.documents,
    ...recentActivity.conversations,
    ...recentActivity.images,
    ...recentActivity.codeGens,
  ]
    .map((item: RecentItem) => ({
      ...item,
      sortDate: new Date(item.createdAt || item.updatedAt || Date.now()),
    }))
    .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
    .slice(0, 8)

  // Plan usage for the stacked bar
  const planLimits = [
    { label: 'Words', used: stats.wordsUsed, limit: stats.wordsLimit, color: 'bg-emerald-500' },
    { label: 'Images', used: stats.imagesUsed, limit: stats.imagesLimit, color: 'bg-teal-500' },
    { label: 'Chat', used: stats.chatMessages, limit: stats.chatMessagesLimit, color: 'bg-cyan-500' },
    { label: 'Code', used: stats.codeGenerated, limit: stats.codeLimit, color: 'bg-green-500' },
  ]

  const overallUsage = planLimits.reduce((acc, p) => {
    if (isUnlimited(p.limit)) return acc
    return acc + (p.used / p.limit)
  }, 0)
  const overallCount = planLimits.filter(p => !isUnlimited(p.limit)).length
  const overallPercent = overallCount > 0 ? (overallUsage / overallCount) * 100 : 0
  const isNearLimit = overallPercent > 75

  // Quick actions
  const quickActions = [
    { title: 'Start Writing', icon: PenLine, page: 'writer' as const, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'AI Chat', icon: MessageSquare, page: 'chat' as const, color: 'text-teal-400', bg: 'bg-teal-500/10' },
    { title: 'Generate Image', icon: ImageIcon, page: 'image' as const, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { title: 'Write Code', icon: Code2, page: 'code' as const, color: 'text-green-400', bg: 'bg-green-500/10' },
    { title: 'Transcribe Audio', icon: Mic, page: 'speech-to-text' as const, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Text to Speech', icon: Volume2, page: 'text-to-speech' as const, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ]

  // Type icon and color for recent activity
  function getActivityIcon(type: string) {
    switch (type) {
      case 'document':
        return { icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
      case 'conversation':
        return { icon: MessageSquare, color: 'text-teal-400', bg: 'bg-teal-500/10' }
      case 'image':
        return { icon: ImageIcon, color: 'text-cyan-400', bg: 'bg-cyan-500/10' }
      case 'code':
        return { icon: Code2, color: 'text-green-400', bg: 'bg-green-500/10' }
      default:
        return { icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
    }
  }

  function getActivityTitle(item: RecentItem): string {
    switch (item.type) {
      case 'document':
        return item.title || 'Untitled Document'
      case 'conversation':
        return item.title || 'New Conversation'
      case 'image':
        return item.prompt ? (item.prompt.length > 40 ? item.prompt.slice(0, 40) + '…' : item.prompt) : 'Image Generation'
      case 'code':
        return item.prompt ? (item.prompt.length > 40 ? item.prompt.slice(0, 40) + '…' : item.prompt) : 'Code Generation'
      default:
        return 'Activity'
    }
  }

  function getActivitySubtitle(item: RecentItem): string {
    switch (item.type) {
      case 'document':
        return item.templateName || 'Text Document'
      case 'conversation':
        return item.assistantType ? `${item.assistantType.charAt(0).toUpperCase() + item.assistantType.slice(1)} Assistant` : 'Chat'
      case 'image':
        return item.size ? `Image • ${item.size}` : 'Image'
      case 'code':
        return item.language ? `Code • ${item.language}` : 'Code'
      default:
        return ''
    }
  }

  function getActivityMeta(item: RecentItem): string | null {
    if (item.type === 'document' && item.wordsCount) {
      return `${item.wordsCount.toLocaleString()} words`
    }
    return null
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Welcome Section ─────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s an overview of your AI content generation activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={`gap-1.5 px-3 py-1 text-sm font-medium border-0 ${
              stats.plan === 'professional' || stats.plan === 'monthly' || stats.plan === 'yearly'
                ? 'bg-emerald-500/15 text-emerald-400'
                : stats.plan === 'enterprise'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {(stats.plan === 'professional' || stats.plan === 'monthly' || stats.plan === 'yearly' || stats.plan === 'enterprise') && (
              <Crown className="size-3.5" />
            )}
            {getPlanLabel(stats.plan)} Plan
          </Badge>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="size-3.5 text-emerald-400" />
            <span>{totals.documents + totals.conversations + totals.images + totals.codeGenerations} total items</span>
          </div>
        </div>
      </motion.div>

      {/* ── Usage Stats Cards ────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Words Generated"
          value={stats.wordsUsed}
          limit={stats.wordsLimit}
          icon={<FileText className="size-5 text-emerald-400" />}
          gradient="bg-gradient-to-br from-emerald-500/5 to-emerald-500/[0.02]"
          iconBg="bg-emerald-500/10"
          changePercent={12}
          index={0}
        />
        <StatCard
          title="Images Created"
          value={stats.imagesUsed}
          limit={stats.imagesLimit}
          icon={<ImageIcon className="size-5 text-teal-400" />}
          gradient="bg-gradient-to-br from-teal-500/5 to-teal-500/[0.02]"
          iconBg="bg-teal-500/10"
          changePercent={24}
          index={1}
        />
        <StatCard
          title="Chat Messages"
          value={stats.chatMessages}
          limit={stats.chatMessagesLimit}
          icon={<MessageSquare className="size-5 text-cyan-400" />}
          gradient="bg-gradient-to-br from-cyan-500/5 to-cyan-500/[0.02]"
          iconBg="bg-cyan-500/10"
          changePercent={-5}
          index={2}
        />
        <StatCard
          title="Code Generations"
          value={stats.codeGenerated}
          limit={stats.codeLimit}
          icon={<Code2 className="size-5 text-green-400" />}
          gradient="bg-gradient-to-br from-green-500/5 to-green-500/[0.02]"
          iconBg="bg-green-500/10"
          changePercent={18}
          index={3}
        />
      </div>

      {/* ── Quick Actions ────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5 text-emerald-400" />
              Quick Actions
            </CardTitle>
            <CardDescription>Jump right into creating with AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {quickActions.map((action) => (
                <motion.button
                  key={action.page}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActivePage(action.page)}
                  className="group flex flex-col items-center gap-2.5 rounded-xl border border-border p-4 transition-all hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/5 cursor-pointer bg-background"
                >
                  <div className={`flex items-center justify-center size-11 rounded-xl ${action.bg} transition-colors group-hover:scale-110`}>
                    <action.icon className={`size-5 ${action.color}`} />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">{action.title}</span>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Chart + Recent Activity ──────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Usage Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Usage This Week</CardTitle>
              <CardDescription>Daily activity across all generation types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyUsage} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      formatter={(value: string) => (
                        <span className="text-muted-foreground text-xs">{value}</span>
                      )}
                    />
                    <Bar dataKey="words" name="Words" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="chats" name="Chat" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="code" name="Code" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>Your latest generations</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-400 hover:text-emerald-300 gap-1"
                  onClick={() => setActivePage('documents')}
                >
                  View All
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {allRecent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex items-center justify-center size-14 rounded-2xl bg-emerald-500/10 mb-3">
                    <Sparkles className="size-6 text-emerald-400" />
                  </div>
                  <p className="text-sm font-medium">No activity yet</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Start creating to see your activity here
                  </p>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setActivePage('writer')}
                  >
                    Start Creating
                    <ArrowRight className="size-3.5 ml-1" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
                  {allRecent.map((item) => {
                    const { icon: TypeIcon, color, bg } = getActivityIcon(item.type)
                    const meta = getActivityMeta(item)

                    return (
                      <motion.div
                        key={`${item.type}-${item.id}`}
                        whileHover={{ x: 2 }}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => {
                          if (item.type === 'document' || item.type === 'image') setActivePage('documents')
                          else if (item.type === 'conversation') setActivePage('chat')
                          else if (item.type === 'code') setActivePage('code')
                        }}
                      >
                        <div className={`flex items-center justify-center size-9 rounded-lg ${bg} shrink-0`}>
                          <TypeIcon className={`size-4 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {getActivityTitle(item)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {getActivitySubtitle(item)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="size-2.5" />
                            {timeAgo(item.createdAt || item.updatedAt || new Date().toISOString())}
                          </span>
                          {meta && (
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {meta}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Plan Usage Section ───────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Plan Usage</CardTitle>
                <CardDescription>Overview of your current plan limits</CardDescription>
              </div>
              {isNearLimit && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  onClick={() => setActivePage('pricing')}
                >
                  <Crown className="size-3.5" />
                  Upgrade Plan
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Overall usage bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Usage</span>
                <span className={`text-sm font-medium ${isNearLimit ? 'text-amber-500' : 'text-emerald-400'}`}>
                  {overallPercent.toFixed(1)}%
                </span>
              </div>
              <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
                <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${Math.min(overallPercent, 100)}%` }}
                />
              </div>
            </div>

            <Separator className="mb-5" />

            {/* Per-category breakdown */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {planLimits.map((category) => {
                const pct = isUnlimited(category.limit)
                  ? 0
                  : Math.min((category.used / category.limit) * 100, 100)
                const displayLimit = isUnlimited(category.limit) ? '∞' : formatNumber(category.limit)
                const nearLimit = !isUnlimited(category.limit) && pct > 80

                return (
                  <div key={category.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category.label}</span>
                      {nearLimit && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-500 border-amber-500/30">
                          Near limit
                        </Badge>
                      )}
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full ${category.color} transition-all duration-500 ${
                          nearLimit ? 'bg-amber-500' : ''
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatNumber(category.used)}</span>
                      <span>{displayLimit}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Upgrade CTA at bottom if near limits */}
            {isNearLimit && (
              <div className="mt-5 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-9 rounded-lg bg-emerald-500/10 shrink-0 mt-0.5">
                    <Crown className="size-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">You&apos;re approaching your plan limits</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Upgrade to a higher plan for more words, images, and features.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                  onClick={() => setActivePage('pricing')}
                >
                  View Plans
                  <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
