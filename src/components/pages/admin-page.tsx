'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Users,
  FileText,
  ImageIcon,
  MessageSquare,
  Code2,
  DollarSign,
  TrendingUp,
  Search,
  MoreHorizontal,
  Trash2,
  UserCog,
  Ban,
  CheckCircle2,
  XCircle,
  Crown,
  RefreshCcw,
  Save,
  Settings,
  BarChart3,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Activity,
  Eye,
  EyeOff,
  CreditCard,
  Plus,
  Pencil,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
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

// ─── Types ───────────────────────────────────────────────────────────

interface AdminStats {
  users: { total: number; active: number; recentSignups: number }
  content: {
    totalDocuments: number
    totalImages: number
    totalCodeGens: number
    totalConversations: number
    totalTranscriptions: number
    totalTTS: number
  }
  revenue: {
    monthly: number
    activeSubscriptions: number
    planDistribution: { plan: string; count: number }[]
  }
  usage: {
    totalWords: number
    totalImages: number
    totalChat: number
    totalCode: number
  }
  topTemplates: { name: string; count: number }[]
  dailyActivity: {
    day: string
    date: string
    documents: number
    conversations: number
    images: number
  }[]
}

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
  plan: string
  wordsUsed: number
  imagesUsed: number
  chatMessages: number
  codeGenerated: number
  isActive: boolean
  createdAt: string
  _count: {
    generatedDocs: number
    conversations: number
    imageGens: number
    codeGens: number
  }
}

interface AdminSettings {
  [key: string]: string
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString()
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

function getPlanColor(plan: string) {
  switch (plan) {
    case 'enterprise':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0'
    case 'professional':
    case 'monthly':
    case 'yearly':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0'
    case 'starter':
      return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-0'
    default:
      return 'bg-muted text-muted-foreground border-0'
  }
}

function getRoleColor(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0'
    default:
      return 'bg-muted text-muted-foreground border-0'
  }
}

// ─── Chart Tooltip ───────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background/95 backdrop-blur-sm px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-foreground mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground">{item.name}:</span>
            <span className="font-medium text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────

function AdminStatCard({ title, value, subtitle, icon, gradient, iconBg, change }: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  gradient: string
  iconBg: string
  change?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`relative overflow-hidden border-0 ${gradient}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className={`flex items-center justify-center size-10 rounded-xl ${iconBg}`}>
              {icon}
            </div>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                change >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
              }`}>
                <TrendingUp className="size-3" />
                {change >= 0 ? '+' : ''}{change}%
              </div>
            )}
          </div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────

export function AdminPage() {
  // State
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersPage, setUsersPage] = useState(1)
  const [settings, setSettings] = useState<AdminSettings>({})
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')
  const [userPlanFilter, setUserPlanFilter] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<AdminUser | null>(null)
  const [planDialog, setPlanDialog] = useState<AdminUser | null>(null)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [settingsForm, setSettingsForm] = useState<AdminSettings>({})
  const [savingSettings, setSavingSettings] = useState(false)

  // ─── Fetch stats ─────────────────────────────────────────────────

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (err) {
        console.error('Stats fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  // ─── Fetch users ─────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams({
        page: usersPage.toString(),
        limit: '15',
      })
      if (userSearch) params.set('search', userSearch)
      if (userRoleFilter) params.set('role', userRoleFilter)
      if (userPlanFilter) params.set('plan', userPlanFilter)

      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
        setUsersTotal(data.total || 0)
      }
    } catch (err) {
      console.error('Users fetch error:', err)
    } finally {
      setUsersLoading(false)
    }
  }, [usersPage, userSearch, userRoleFilter, userPlanFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // ─── Fetch settings ──────────────────────────────────────────────

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings || {})
        setSettingsForm(data.settings || {})
      }
    } catch (err) {
      console.error('Settings fetch error:', err)
    } finally {
      setSettingsLoading(false)
    }
  }, [])

  // ─── User actions ────────────────────────────────────────────────

  const handleUserAction = async (userId: string, action: string, extra?: Record<string, string>) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, ...extra }),
      })
      if (res.ok) {
        toast.success(`User ${action.replace('_', ' ')} successfully`)
        fetchUsers()
      } else {
        toast.error('Failed to update user')
      }
    } catch {
      toast.error('Failed to update user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('User deleted successfully')
        setDeleteDialog(null)
        fetchUsers()
      } else {
        toast.error('Failed to delete user')
      }
    } catch {
      toast.error('Failed to delete user')
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsForm }),
      })
      if (res.ok) {
        toast.success('Settings saved successfully')
        setSettings(settingsForm)
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  // ─── Loading skeleton ────────────────────────────────────────────

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  const totalPages = Math.ceil(usersTotal / 15)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="size-6 text-amber-500" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users, monitor usage, and configure platform settings
          </p>
        </div>
        <Badge className="gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-sm w-fit">
          <Crown className="size-3.5" />
          Administrator Access
        </Badge>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          title="Total Users"
          value={formatNumber(stats.users.total)}
          subtitle={`${stats.users.active} active, ${stats.users.recentSignups} new this month`}
          icon={<Users className="size-5 text-emerald-400" />}
          gradient="bg-gradient-to-br from-emerald-500/5 to-emerald-500/[0.02]"
          iconBg="bg-emerald-500/10"
          change={stats.users.recentSignups > 0 ? Math.round((stats.users.recentSignups / Math.max(stats.users.total, 1)) * 100) : 0}
        />
        <AdminStatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.revenue.monthly)}
          subtitle={`${stats.revenue.activeSubscriptions} active subscriptions`}
          icon={<DollarSign className="size-5 text-teal-400" />}
          gradient="bg-gradient-to-br from-teal-500/5 to-teal-500/[0.02]"
          iconBg="bg-teal-500/10"
        />
        <AdminStatCard
          title="Content Generated"
          value={formatNumber(stats.content.totalDocuments + stats.content.totalImages + stats.content.totalCodeGens)}
          subtitle={`${formatNumber(stats.usage.totalWords)} words total`}
          icon={<FileText className="size-5 text-cyan-400" />}
          gradient="bg-gradient-to-br from-cyan-500/5 to-cyan-500/[0.02]"
          iconBg="bg-cyan-500/10"
        />
        <AdminStatCard
          title="AI Interactions"
          value={formatNumber(stats.usage.totalChat + stats.usage.totalCode)}
          subtitle={`${formatNumber(stats.usage.totalChat)} chats, ${formatNumber(stats.usage.totalCode)} code gens`}
          icon={<Activity className="size-5 text-green-400" />}
          gradient="bg-gradient-to-br from-green-500/5 to-green-500/[0.02]"
          iconBg="bg-green-500/10"
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6" onValueChange={(val) => {
        if (val === 'users' && users.length === 0) fetchUsers()
        if (val === 'settings' && Object.keys(settings).length === 0) fetchSettings()
      }}>
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="size-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="size-3.5" />
            Users
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-1.5">
            <CreditCard className="size-3.5" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-1.5">
            <Crown className="size-3.5" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="size-3.5" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ──────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Activity Chart */}
            <Card className="lg:col-span-3 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Platform Activity</CardTitle>
                <CardDescription>Daily generation activity (last 7 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.dailyActivity} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                      <Bar dataKey="documents" name="Documents" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="conversations" name="Chats" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="images" name="Images" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Templates & Plan Distribution */}
            <div className="lg:col-span-2 space-y-6">
              {/* Plan Distribution */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Plan Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.revenue.planDistribution.map((p) => {
                    const total = stats.users.total || 1
                    const pct = (p.count / total) * 100
                    return (
                      <div key={p.plan} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{p.plan}</span>
                          <span className="text-xs text-muted-foreground">{p.count} users ({pct.toFixed(1)}%)</span>
                        </div>
                        <Progress value={pct} className="h-2 [&>[data-slot=progress-indicator]]:bg-emerald-500" />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Top Templates */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Top Templates</CardTitle>
                  <CardDescription>Most used templates</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.topTemplates.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No template usage yet</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.topTemplates.map((template, idx) => (
                        <div key={template.name} className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground w-5">{idx + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{template.name}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {template.count} uses
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Content Breakdown */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Content Breakdown</CardTitle>
              <CardDescription>Total generated content across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { label: 'Documents', value: stats.content.totalDocuments, icon: FileText, color: 'text-emerald-400' },
                  { label: 'Images', value: stats.content.totalImages, icon: ImageIcon, color: 'text-teal-400' },
                  { label: 'Code', value: stats.content.totalCodeGens, icon: Code2, color: 'text-cyan-400' },
                  { label: 'Conversations', value: stats.content.totalConversations, icon: MessageSquare, color: 'text-green-400' },
                  { label: 'Transcriptions', value: stats.content.totalTranscriptions, icon: Activity, color: 'text-amber-400' },
                  { label: 'TTS', value: stats.content.totalTTS, icon: Activity, color: 'text-rose-400' },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-muted/20">
                    <item.icon className={`size-5 ${item.color}`} />
                    <span className="text-xl font-bold">{formatNumber(item.value)}</span>
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Users Tab ──────────────────────────────────────────────── */}
        <TabsContent value="users" className="space-y-4">
          {/* Search and Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); setUsersPage(1) }}
                    className="pl-9"
                  />
                </div>
                <Select value={userRoleFilter} onValueChange={(val) => { setUserRoleFilter(val === 'all' ? '' : val); setUsersPage(1) }}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userPlanFilter} onValueChange={(val) => { setUserPlanFilter(val === 'all' ? '' : val); setUsersPage(1) }}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="All Plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={fetchUsers} title="Refresh">
                  <RefreshCcw className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="size-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium">No users found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead className="text-right">Words</TableHead>
                          <TableHead className="text-right">Images</TableHead>
                          <TableHead className="text-right">Chats</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{user.name || 'Unnamed'}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] ${getRoleColor(user.role)}`}>
                                {user.role === 'admin' && <Crown className="size-3 mr-1" />}
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${getPlanColor(user.plan)}`}>
                                {user.plan}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs font-mono">
                              {formatNumber(user.wordsUsed)}
                            </TableCell>
                            <TableCell className="text-right text-xs font-mono">
                              {formatNumber(user.imagesUsed)}
                            </TableCell>
                            <TableCell className="text-right text-xs font-mono">
                              {formatNumber(user.chatMessages)}
                            </TableCell>
                            <TableCell>
                              {user.isActive ? (
                                <CheckCircle2 className="size-4 text-emerald-500" />
                              ) : (
                                <XCircle className="size-4 text-red-400" />
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-8">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {user.role !== 'admin' && (
                                    <DropdownMenuItem onClick={() => handleUserAction(user.id, 'set_admin')}>
                                      <Crown className="size-3.5 mr-2 text-amber-500" />
                                      Make Admin
                                    </DropdownMenuItem>
                                  )}
                                  {user.role === 'admin' && (
                                    <DropdownMenuItem onClick={() => handleUserAction(user.id, 'set_user')}>
                                      <UserCog className="size-3.5 mr-2" />
                                      Remove Admin
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => { setPlanDialog(user); setSelectedPlan(user.plan) }}>
                                    <Crown className="size-3.5 mr-2" />
                                    Change Plan
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleUserAction(user.id, 'reset_usage')}>
                                    <RefreshCcw className="size-3.5 mr-2" />
                                    Reset Usage
                                  </DropdownMenuItem>
                                  {user.isActive ? (
                                    <DropdownMenuItem onClick={() => handleUserAction(user.id, 'deactivate')}>
                                      <Ban className="size-3.5 mr-2 text-red-500" />
                                      Deactivate
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleUserAction(user.id, 'activate')}>
                                      <CheckCircle2 className="size-3.5 mr-2 text-emerald-500" />
                                      Activate
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteDialog(user)}
                                  >
                                    <Trash2 className="size-3.5 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between p-4 border-t">
                    <span className="text-xs text-muted-foreground">
                      {usersTotal} total users
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={usersPage <= 1}
                        onClick={() => setUsersPage(usersPage - 1)}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Page {usersPage} of {totalPages || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={usersPage >= totalPages}
                        onClick={() => setUsersPage(usersPage + 1)}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Settings Tab ───────────────────────────────────────────── */}
        <TabsContent value="settings" className="space-y-6">
          {settingsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* General Settings */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">General Settings</CardTitle>
                  <CardDescription>Configure your platform basics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Site Name</Label>
                      <Input
                        value={settingsForm.site_name || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, site_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Site Description</Label>
                      <Input
                        value={settingsForm.site_description || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, site_description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Default AI Model</Label>
                      <Select value={settingsForm.default_model || 'gpt-4o-mini'} onValueChange={(val) => setSettingsForm({ ...settingsForm, default_model: val })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>OpenAI API Key</Label>
                      <div className="relative">
                        <Input
                          type="password"
                          value={settingsForm.openai_api_key || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, openai_api_key: e.target.value })}
                          placeholder="sk-..."
                          className="pr-10"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Free Plan Limits */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Free Plan Limits</CardTitle>
                  <CardDescription>Set usage limits for free tier users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Max Words per Month</Label>
                      <Input
                        type="number"
                        value={settingsForm.max_free_words || '5000'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, max_free_words: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Images per Month</Label>
                      <Input
                        type="number"
                        value={settingsForm.max_free_images || '10'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, max_free_images: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Settings */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Additional Settings</CardTitle>
                  <CardDescription>Custom key-value settings for advanced configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(settingsForm)
                      .filter(([key]) => !['site_name', 'site_description', 'default_model', 'openai_api_key', 'max_free_words', 'max_free_images'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="grid grid-cols-[1fr_2fr] gap-3 items-center">
                          <Input value={key} disabled className="text-xs font-mono" />
                          <Input
                            value={value}
                            onChange={(e) => setSettingsForm({ ...settingsForm, [key]: e.target.value })}
                            className="text-sm"
                          />
                        </div>
                      ))}
                    {Object.keys(settingsForm).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No additional settings</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-32"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-4 mr-2" />
                      Save All Settings
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* ── Subscriptions Tab ──────────────────────────────────────── */}
        <TabsContent value="subscriptions" className="space-y-6">
          <SubscriptionsTab />
        </TabsContent>

        {/* ── Plans Tab ──────────────────────────────────────────────── */}
        <TabsContent value="plans" className="space-y-6">
          <PlansTab />
        </TabsContent>
      </Tabs>

      {/* ── Delete User Dialog ──────────────────────────────────────── */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteDialog?.name || deleteDialog?.email}</strong>?
              This action cannot be undone. All user data including documents, conversations, and generated content will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog && handleDeleteUser(deleteDialog.id)}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change Plan Dialog ──────────────────────────────────────── */}
      <Dialog open={!!planDialog} onOpenChange={() => setPlanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Plan</DialogTitle>
            <DialogDescription>
              Change the subscription plan for <strong>{planDialog?.name || planDialog?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="lifetime">Lifetime</SelectItem>
              <SelectItem value="prepaid">Prepaid</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialog(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (planDialog && selectedPlan) {
                  handleUserAction(planDialog.id, 'set_plan', { plan: selectedPlan })
                  setPlanDialog(null)
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Update Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Subscriptions Tab Component ─────────────────────────────────────────────

function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [revenue, setRevenue] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '15' })
      if (statusFilter) params.set('status', statusFilter)
      if (planFilter) params.set('planType', planFilter)

      const res = await fetch(`/api/admin/subscriptions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSubscriptions(data.subscriptions || [])
        setTotal(data.total || 0)
        setRevenue(data.revenue || null)
      }
    } catch (err) {
      console.error('Subscriptions fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, planFilter])

  useEffect(() => { fetchSubscriptions() }, [fetchSubscriptions])

  const handleAction = async (subscriptionId: string, action: string, data?: any) => {
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, action, data }),
      })
      if (res.ok) {
        toast.success(`Subscription ${action} successful`)
        fetchSubscriptions()
      } else {
        toast.error('Failed to update subscription')
      }
    } catch {
      toast.error('Failed to update subscription')
    }
  }

  const totalPages = Math.ceil(total / 15)

  return (
    <div className="space-y-6">
      {/* Revenue Summary Cards */}
      {revenue && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500/5 to-emerald-500/[0.02]">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="size-4 text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl font-bold">${revenue.mrr.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-500/5 to-teal-500/[0.02]">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-9 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <TrendingUp className="size-4 text-teal-400" />
                </div>
              </div>
              <p className="text-2xl font-bold">${revenue.arr.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Annual Recurring Revenue</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-cyan-500/5 to-cyan-500/[0.02]">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Users className="size-4 text-cyan-400" />
                </div>
              </div>
              <p className="text-2xl font-bold">{revenue.totalActive}</p>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500/5 to-amber-500/[0.02]">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <BarChart3 className="size-4 text-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-bold">
                {Object.keys(revenue.planBreakdown || {}).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Plan Types</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter || 'all'} onValueChange={(val) => { setStatusFilter(val === 'all' ? '' : val); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter || 'all'} onValueChange={(val) => { setPlanFilter(val === 'all' ? '' : val); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchSubscriptions} title="Refresh">
              <RefreshCcw className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CreditCard className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">No subscriptions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Ends</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub: any) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{sub.user?.name || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">{sub.user?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-[10px] capitalize ${getPlanColor(sub.planType)}`}>
                            {sub.planType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-[10px] ${
                            sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-0' :
                            sub.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-0' :
                            'bg-muted text-muted-foreground border-0'
                          }`}>
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-mono">
                          ${(sub.amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(sub.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {sub.status === 'active' && (
                                <DropdownMenuItem onClick={() => handleAction(sub.id, 'cancel')}>
                                  <XCircle className="size-3.5 mr-2 text-red-500" />
                                  Cancel
                                </DropdownMenuItem>
                              )}
                              {sub.status !== 'active' && (
                                <DropdownMenuItem onClick={() => handleAction(sub.id, 'activate')}>
                                  <CheckCircle2 className="size-3.5 mr-2 text-emerald-500" />
                                  Reactivate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleAction(sub.id, 'extend', { months: 1 })}>
                                <Plus className="size-3.5 mr-2" />
                                Extend 1 Month
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-xs text-muted-foreground">{total} total subscriptions</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">Page {page} of {totalPages || 1}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Plans Tab Component ─────────────────────────────────────────────────────

function PlansTab() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<any>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '', slug: '', description: '', price: 0, interval: 'monthly',
    wordsLimit: 0, imagesLimit: 0, chatMessagesLimit: 0, codeLimit: 0, audioMinutesLimit: 0,
    features: '' as string, isPopular: false, isActive: true, sortOrder: 0,
  })

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/plans')
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans || [])
      }
    } catch (err) {
      console.error('Plans fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const resetForm = () => {
    setFormData({
      name: '', slug: '', description: '', price: 0, interval: 'monthly',
      wordsLimit: 0, imagesLimit: 0, chatMessagesLimit: 0, codeLimit: 0, audioMinutesLimit: 0,
      features: '', isPopular: false, isActive: true, sortOrder: 0,
    })
  }

  const openEdit = (plan: any) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price: plan.price,
      interval: plan.interval,
      wordsLimit: plan.wordsLimit,
      imagesLimit: plan.imagesLimit,
      chatMessagesLimit: plan.chatMessagesLimit,
      codeLimit: plan.codeLimit,
      audioMinutesLimit: plan.audioMinutesLimit,
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...formData,
        features: formData.features.split('\n').filter(Boolean),
      }

      if (editingPlan) {
        // Update
        const res = await fetch('/api/admin/plans', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPlan.id, ...payload }),
        })
        if (res.ok) {
          toast.success('Plan updated')
          setEditingPlan(null)
          fetchPlans()
        } else {
          toast.error('Failed to update plan')
        }
      } else {
        // Create
        const res = await fetch('/api/admin/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          toast.success('Plan created')
          setShowCreateDialog(false)
          resetForm()
          fetchPlans()
        } else {
          toast.error('Failed to create plan')
        }
      }
    } catch {
      toast.error('Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return
    try {
      const res = await fetch(`/api/admin/plans?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Plan deleted')
        fetchPlans()
      } else {
        toast.error('Failed to delete plan')
      }
    } catch {
      toast.error('Failed to delete plan')
    }
  }

  const handleToggleActive = async (plan: any) => {
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plan.id, isActive: !plan.isActive }),
      })
      if (res.ok) {
        toast.success(`Plan ${plan.isActive ? 'disabled' : 'enabled'}`)
        fetchPlans()
      }
    } catch {
      toast.error('Failed to update plan')
    }
  }

  // Plan form (shared between create and edit)
  const PlanForm = () => (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Plan Name</Label>
          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Professional" />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="e.g., professional" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Short description" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Price ($)</Label>
          <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label>Interval</Label>
          <Select value={formData.interval} onValueChange={(val) => setFormData({ ...formData, interval: val })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="one-time">One-time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input type="number" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <Separator />
      <p className="text-sm font-medium">Usage Limits (0 = unlimited)</p>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="space-y-2">
          <Label className="text-xs">Words</Label>
          <Input type="number" value={formData.wordsLimit} onChange={(e) => setFormData({ ...formData, wordsLimit: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Images</Label>
          <Input type="number" value={formData.imagesLimit} onChange={(e) => setFormData({ ...formData, imagesLimit: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Chat Messages</Label>
          <Input type="number" value={formData.chatMessagesLimit} onChange={(e) => setFormData({ ...formData, chatMessagesLimit: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Code Gens</Label>
          <Input type="number" value={formData.codeLimit} onChange={(e) => setFormData({ ...formData, codeLimit: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Audio (min)</Label>
          <Input type="number" value={formData.audioMinutesLimit} onChange={(e) => setFormData({ ...formData, audioMinutesLimit: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <Label>Features (one per line)</Label>
        <Textarea
          value={formData.features}
          onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          placeholder="Unlimited AI chat&#10;200 images/month&#10;Priority support"
          rows={5}
        />
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={formData.isPopular} onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })} className="rounded" />
          Mark as Popular
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" />
          Active
        </label>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  // Edit mode
  if (editingPlan) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Edit Plan: {editingPlan.name}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditingPlan(null)}>Cancel</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <PlanForm />
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-32">
              {saving ? <><Loader2 className="size-4 mr-2 animate-spin" />Saving...</> : <><Save className="size-4 mr-2" />Save Changes</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Create mode
  if (showCreateDialog) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Create New Plan</CardTitle>
            <Button variant="outline" size="sm" onClick={() => { setShowCreateDialog(false); resetForm() }}>Cancel</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <PlanForm />
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-32">
              {saving ? <><Loader2 className="size-4 mr-2 animate-spin" />Creating...</> : <><Plus className="size-4 mr-2" />Create Plan</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // List mode
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pricing Plans</h3>
          <p className="text-sm text-muted-foreground">Manage your subscription plans and pricing</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="size-4 mr-2" />
          New Plan
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan: any) => (
          <Card key={plan.id} className={`border-0 shadow-sm relative ${!plan.isActive ? 'opacity-60' : ''}`}>
            {plan.isPopular && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-amber-500/10 text-amber-500 border-0 text-[10px]">Popular</Badge>
              </div>
            )}
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {plan.name}
                {!plan.isActive && <Badge variant="secondary" className="text-[10px]">Disabled</Badge>}
              </CardTitle>
              <CardDescription className="text-xs">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">${plan.price}</span>
                <span className="text-sm text-muted-foreground">/{plan.interval}</span>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Words: {plan.wordsLimit === 0 ? '∞' : plan.wordsLimit.toLocaleString()}</p>
                <p>Images: {plan.imagesLimit === 0 ? '∞' : plan.imagesLimit}</p>
                <p>Chat: {plan.chatMessagesLimit === 0 ? '∞' : plan.chatMessagesLimit}</p>
                <p>Code: {plan.codeLimit === 0 ? '∞' : plan.codeLimit}</p>
              </div>

              {Array.isArray(plan.features) && plan.features.length > 0 && (
                <div className="pt-2 border-t space-y-1">
                  {plan.features.slice(0, 4).map((f: string, i: number) => (
                    <p key={i} className="text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                      {f}
                    </p>
                  ))}
                  {plan.features.length > 4 && (
                    <p className="text-xs text-muted-foreground">+{plan.features.length - 4} more</p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(plan)}>
                  <Pencil className="size-3 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleToggleActive(plan)}>
                  {plan.isActive ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(plan.id)}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
