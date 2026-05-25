'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  User,
  CreditCard,
  Key,
  Bell,
  Shield,
  Sliders,
  Camera,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Trash2,
  Check,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

// Helper for save button with loading state
function SaveButton({ onSave, label = 'Save Changes' }: { onSave: () => Promise<void>; label?: string }) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const handleClick = async () => {
    setState('saving')
    try {
      await onSave()
      setState('saved')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('idle')
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={state === 'saving'}
      className="bg-emerald-600 hover:bg-emerald-700"
    >
      {state === 'saving' && <Loader2 className="size-4 mr-2 animate-spin" />}
      {state === 'saved' && <Check className="size-4 mr-2" />}
      {state === 'idle' && label}
      {state === 'saving' && 'Saving...'}
      {state === 'saved' && 'Saved!'}
    </Button>
  )
}

// ─── Profile Tab ───
function ProfileTab() {
  const { user, setUser } = useAppStore()
  const [name, setName] = useState(() => user?.name || '')
  const [bio, setBio] = useState('')
  const [image, setImage] = useState(() => user?.image || '')

  const handleSave = async () => {
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image }),
      })
      if (res.ok) {
        const data = await res.json()
        if (setUser && user) {
          setUser({ ...user, name: data.user.name, image: data.user.image })
        }
        toast.success('Profile updated successfully')
      }
    } catch {
      toast.error('Failed to update profile')
      throw new Error()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="size-5 text-emerald-500" />
          Profile Information
        </CardTitle>
        <CardDescription>Update your personal details and profile picture</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Picture */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="size-20">
              <AvatarImage src={image} alt={name} />
              <AvatarFallback className="bg-emerald-500/10 text-emerald-600 text-xl">
                {name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="size-5 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Profile Picture</p>
            <p className="text-xs text-muted-foreground">Click the avatar to change your photo</p>
            <Button variant="outline" size="sm" className="text-xs">
              Upload New Photo
            </Button>
          </div>
        </div>

        <Separator />

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            value={user?.email || ''}
            readOnly
            className="bg-muted/50 cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed. Contact support if you need to update it.
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a bit about yourself..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">{bio.length}/500 characters</p>
        </div>

        <div className="flex justify-end">
          <SaveButton onSave={handleSave} />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Subscription Tab ───
function SubscriptionTab() {
  const { user, setActivePage } = useAppStore()
  const plan = user?.plan || 'free'

  const planDetails: Record<string, { name: string; words: number; images: number; chats: number; price: string }> = {
    free: { name: 'Free', words: 1000, images: 5, chats: 20, price: '$0' },
    starter: { name: 'Starter', words: 50000, images: 50, chats: 500, price: '$9.99' },
    professional: { name: 'Professional', words: 200000, images: 200, chats: 999999, price: '$29.99' },
    enterprise: { name: 'Enterprise', words: 999999, images: 999999, chats: 999999, price: '$99.99' },
  }

  const currentPlan = planDetails[plan] || planDetails.free
  const wordUsage = Math.min(((user?.wordsUsed || 0) / currentPlan.words) * 100, 100)
  const imageUsage = Math.min(((user?.imagesUsed || 0) / currentPlan.images) * 100, 100)
  const chatUsage = Math.min(((user?.chatMessages || 0) / currentPlan.chats) * 100, 100)

  const billingHistory = [
    { date: '2025-01-15', description: 'Professional Plan - Monthly', amount: '$29.99', status: 'Paid' },
    { date: '2024-12-15', description: 'Professional Plan - Monthly', amount: '$29.99', status: 'Paid' },
    { date: '2024-11-15', description: 'Starter Plan - Monthly', amount: '$9.99', status: 'Paid' },
    { date: '2024-10-15', description: 'Starter Plan - Monthly', amount: '$9.99', status: 'Paid' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5 text-emerald-500" />
            Current Plan
          </CardTitle>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{currentPlan.name} Plan</h3>
                <Badge className="bg-emerald-600 hover:bg-emerald-700">
                  Active
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {currentPlan.price}/month • Renews on Feb 15, 2025
              </p>
            </div>
            <Button
              variant="outline"
              className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10"
              onClick={() => setActivePage('pricing')}
            >
              Change Plan
            </Button>
          </div>

          {/* Usage */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Usage This Period</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Words Generated</span>
                  <span>{user?.wordsUsed || 0} / {currentPlan.words === 999999 ? '∞' : currentPlan.words.toLocaleString()}</span>
                </div>
                <Progress value={wordUsage} className="h-2" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Images Created</span>
                  <span>{user?.imagesUsed || 0} / {currentPlan.images === 999999 ? '∞' : currentPlan.images.toLocaleString()}</span>
                </div>
                <Progress value={imageUsage} className="h-2" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Chat Messages</span>
                  <span>{user?.chatMessages || 0} / {currentPlan.chats === 999999 ? '∞' : currentPlan.chats.toLocaleString()}</span>
                </div>
                <Progress value={chatUsage} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingHistory.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-sm">{item.date}</TableCell>
                  <TableCell className="text-sm">{item.description}</TableCell>
                  <TableCell className="text-sm font-medium">{item.amount}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-emerald-600">{item.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── API Keys Tab ───
function ApiKeysTab() {
  const [openaiKey, setOpenaiKey] = useState('')
  const [sdKey, setSdKey] = useState('')
  const [showOpenai, setShowOpenai] = useState(false)
  const [showSd, setShowSd] = useState(false)
  const [useOwnKey, setUseOwnKey] = useState(false)

  const handleSave = async () => {
    // Simulate saving
    await new Promise((r) => setTimeout(r, 800))
    toast.success('API keys saved successfully')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="size-5 text-emerald-500" />
          API Keys
        </CardTitle>
        <CardDescription>Configure your own API keys for AI providers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Use your own API keys</Label>
            <p className="text-xs text-muted-foreground">
              When enabled, API calls will use your keys instead of platform credits
            </p>
          </div>
          <Switch
            checked={useOwnKey}
            onCheckedChange={setUseOwnKey}
          />
        </div>

        <div className="space-y-4">
          {/* OpenAI Key */}
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <div className="relative">
              <Input
                id="openai-key"
                type={showOpenai ? 'text' : 'password'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="pr-10"
                disabled={!useOwnKey}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowOpenai(!showOpenai)}
                disabled={!useOwnKey}
              >
                {showOpenai ? (
                  <EyeOff className="size-4 text-muted-foreground" />
                ) : (
                  <Eye className="size-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Used for text generation, chat, and code generation
            </p>
          </div>

          {/* Stable Diffusion Key */}
          <div className="space-y-2">
            <Label htmlFor="sd-key">Stable Diffusion API Key</Label>
            <div className="relative">
              <Input
                id="sd-key"
                type={showSd ? 'text' : 'password'}
                value={sdKey}
                onChange={(e) => setSdKey(e.target.value)}
                placeholder="sd-..."
                className="pr-10"
                disabled={!useOwnKey}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowSd(!showSd)}
                disabled={!useOwnKey}
              >
                {showSd ? (
                  <EyeOff className="size-4 text-muted-foreground" />
                ) : (
                  <Eye className="size-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Used for image generation
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <p className="text-xs">
            Your API keys are encrypted and stored securely. They are never shared with third parties. Using your own keys may reduce platform credit consumption.
          </p>
        </div>

        <div className="flex justify-end">
          <SaveButton onSave={handleSave} label="Save API Keys" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Notifications Tab ───
function NotificationsTab() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [usageAlerts, setUsageAlerts] = useState(true)
  const [newFeatures, setNewFeatures] = useState(false)
  const [weeklyReport, setWeeklyReport] = useState(true)

  const handleSave = async () => {
    await new Promise((r) => setTimeout(r, 800))
    toast.success('Notification preferences saved')
  }

  const notifications = [
    {
      id: 'email',
      label: 'Email Notifications',
      description: 'Receive email updates about your account activity',
      checked: emailNotifications,
      onChange: setEmailNotifications,
    },
    {
      id: 'usage',
      label: 'Usage Alerts',
      description: 'Get notified when you approach your plan limits',
      checked: usageAlerts,
      onChange: setUsageAlerts,
    },
    {
      id: 'features',
      label: 'New Feature Announcements',
      description: 'Stay informed about new features and improvements',
      checked: newFeatures,
      onChange: setNewFeatures,
    },
    {
      id: 'weekly',
      label: 'Weekly Activity Report',
      description: 'Receive a weekly summary of your AI usage',
      checked: weeklyReport,
      onChange: setWeeklyReport,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-5 text-emerald-500" />
          Notification Preferences
        </CardTitle>
        <CardDescription>Choose how and when you want to be notified</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-0.5 mr-4">
                <Label className="text-sm font-medium cursor-pointer" htmlFor={notif.id}>
                  {notif.label}
                </Label>
                <p className="text-xs text-muted-foreground">{notif.description}</p>
              </div>
              <Switch
                id={notif.id}
                checked={notif.checked}
                onCheckedChange={notif.onChange}
              />
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex justify-end">
          <SaveButton onSave={handleSave} label="Save Preferences" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Security Tab ───
function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [twoFactor, setTwoFactor] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const handlePasswordSave = async () => {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      throw new Error()
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      throw new Error()
    }
    await new Promise((r) => setTimeout(r, 800))
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    toast.success('Password updated successfully')
  }

  const sessions = [
    { device: 'Chrome on Windows', icon: Monitor, lastActive: 'Active now', current: true },
    { device: 'Safari on iPhone', icon: Smartphone, lastActive: '2 hours ago', current: false },
    { device: 'Firefox on MacOS', icon: Monitor, lastActive: '1 day ago', current: false },
  ]

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5 text-emerald-500" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            {newPassword && newPassword.length < 8 && (
              <p className="text-xs text-red-500">Password must be at least 8 characters</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>
          <div className="flex justify-end">
            <SaveButton onSave={handlePasswordSave} label="Update Password" />
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Auth */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Enable 2FA</Label>
              <p className="text-xs text-muted-foreground">
                {twoFactor
                  ? 'Two-factor authentication is enabled. You\'ll be asked for a code when signing in.'
                  : 'Protect your account with an authenticator app or SMS verification'}
              </p>
            </div>
            <Switch checked={twoFactor} onCheckedChange={(v) => {
              setTwoFactor(v)
              toast.success(v ? '2FA enabled' : '2FA disabled')
            }} />
          </div>
          {twoFactor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5"
            >
              <h4 className="font-medium text-sm mb-2">Setup Instructions</h4>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code that will be displayed</li>
                <li>Enter the 6-digit code from the app to verify</li>
                <li>Save your backup codes in a secure location</li>
              </ol>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Sessions</CardTitle>
          <CardDescription>Manage your active login sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.map((session, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <session.icon className="size-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{session.device}</p>
                    <p className="text-xs text-muted-foreground">{session.lastActive}</p>
                  </div>
                </div>
                {session.current ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-xs">Current</Badge>
                ) : (
                  <Button variant="outline" size="sm" className="text-xs">
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
          <CardDescription>Permanently delete your account and all associated data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Once deleted, your account cannot be recovered
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="size-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your data, documents, and
              settings will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText('') }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== 'DELETE'}
              onClick={() => {
                toast.success('Account deletion scheduled')
                setDeleteDialogOpen(false)
                setDeleteConfirmText('')
              }}
            >
              <Trash2 className="size-4 mr-2" />
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Preferences Tab ───
function PreferencesTab() {
  const { darkMode, setDarkMode } = useAppStore()
  const [language, setLanguage] = useState('english')
  const [tone, setTone] = useState('professional')
  const [outputLength, setOutputLength] = useState('medium')
  const [autoSave, setAutoSave] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleSave = async () => {
    await new Promise((r) => setTimeout(r, 800))
    toast.success('Preferences saved successfully')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sliders className="size-5 text-emerald-500" />
          Preferences
        </CardTitle>
        <CardDescription>Customize your default experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Language */}
        <div className="space-y-2">
          <Label>Default Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="spanish">Spanish</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="german">German</SelectItem>
              <SelectItem value="chinese">Chinese</SelectItem>
              <SelectItem value="japanese">Japanese</SelectItem>
              <SelectItem value="korean">Korean</SelectItem>
              <SelectItem value="portuguese">Portuguese</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Default Tone */}
        <div className="space-y-2">
          <Label>Default Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger>
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="persuasive">Persuasive</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Default Output Length */}
        <div className="space-y-2">
          <Label>Default Output Length</Label>
          <div className="grid grid-cols-3 gap-2">
            {['short', 'medium', 'long'].map((len) => (
              <Button
                key={len}
                variant={outputLength === len ? 'default' : 'outline'}
                className={outputLength === len ? 'bg-emerald-600 hover:bg-emerald-700 capitalize' : 'capitalize'}
                onClick={() => setOutputLength(len)}
              >
                {len}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Toggle Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Auto-save</Label>
              <p className="text-xs text-muted-foreground">
                Automatically save your work as you type
              </p>
            </div>
            <Switch checked={autoSave} onCheckedChange={setAutoSave} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Dark Mode</Label>
              <p className="text-xs text-muted-foreground">
                Use dark theme for the interface
              </p>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={(v) => {
                setDarkMode(v)
              }}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Sidebar Collapsed</Label>
              <p className="text-xs text-muted-foreground">
                Start with the sidebar collapsed by default
              </p>
            </div>
            <Switch checked={sidebarCollapsed} onCheckedChange={setSidebarCollapsed} />
          </div>
        </div>

        <div className="flex justify-end">
          <SaveButton onSave={handleSave} label="Save Preferences" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Settings Page ───
export function SettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="size-6 text-emerald-500" />
          Settings
        </h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="size-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-1.5">
            <CreditCard className="size-4" />
            <span className="hidden sm:inline">Subscription</span>
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-1.5">
            <Key className="size-4" />
            <span className="hidden sm:inline">API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="size-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Shield className="size-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1.5">
            <Sliders className="size-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="subscription">
          <SubscriptionTab />
        </TabsContent>
        <TabsContent value="api-keys">
          <ApiKeysTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
