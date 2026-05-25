'use client'

import { useState } from 'react'
import { Sparkles, ShieldCheck, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'

// ─── Test Credentials ───────────────────────────────────────────────────────────

const TEST_CREDENTIALS = [
  {
    email: 'admin@davinci.ai',
    password: 'admin123',
    user: {
      id: 'admin-001',
      email: 'admin@davinci.ai',
      name: 'Admin User',
      role: 'admin',
      plan: 'enterprise',
    },
  },
  {
    email: 'user@davinci.ai',
    password: 'user123',
    user: {
      id: 'user-001',
      email: 'user@davinci.ai',
      name: 'Alex Johnson',
      role: 'user',
      plan: 'professional',
    },
  },
]

// ─── Component ───────────────────────────────────────────────────────────────────

export function AuthGate() {
  const { setUser } = useAppStore()
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    const email = loginEmail.trim().toLowerCase()
    const password = loginPassword

    // Check against test credentials
    const match = TEST_CREDENTIALS.find(
      (c) => c.email === email && c.password === password
    )

    if (match) {
      setUser(match.user)
      setIsLoading(false)
      return
    }

    // If email matches but password doesn't
    const emailMatch = TEST_CREDENTIALS.find((c) => c.email === email)
    if (emailMatch) {
      setLoginError('Invalid password. Please check your credentials.')
      setIsLoading(false)
      return
    }

    // For any other email/password combo, create a regular user
    setUser({
      id: `user-${Date.now()}`,
      email: email || 'user@davinci.ai',
      name: email.split('@')[0] || 'User',
      role: 'user',
      plan: 'free',
    })
    setIsLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (registerPassword !== registerConfirmPassword) return
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setUser({
      id: `user-${Date.now()}`,
      email: registerEmail || 'user@davinci.ai',
      name: registerName || 'New User',
      role: 'user',
      plan: 'free',
    })
    setIsLoading(false)
  }

  const handleGuest = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    setUser({
      id: 'guest',
      email: 'guest@davinci.ai',
      name: 'Guest User',
      role: 'guest',
      plan: 'free',
    })
    setIsLoading(false)
  }

  const fillAdminCredentials = () => {
    setLoginEmail('admin@davinci.ai')
    setLoginPassword('admin123')
  }

  const fillUserCredentials = () => {
    setLoginEmail('user@davinci.ai')
    setLoginPassword('user123')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-background to-teal-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-teal-500/5" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
            <Sparkles className="size-5" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Davinci AI
          </h1>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/10">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-xl">Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value)
                        setLoginError('')
                      }}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value)
                        setLoginError('')
                      }}
                      className="bg-background/50"
                    />
                  </div>

                  {/* Error message */}
                  {loginError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive font-medium"
                    >
                      {loginError}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                {/* Quick-fill test credentials */}
                <div className="mt-4 p-3 rounded-lg border border-border/50 bg-muted/30">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Info className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Test Credentials</span>
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={fillAdminCredentials}
                      className="w-full flex items-center gap-2.5 p-2 rounded-md border border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left group"
                    >
                      <div className="flex items-center justify-center size-8 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 shrink-0">
                        <ShieldCheck className="size-4 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Admin</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0">
                            ADMIN
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          admin@davinci.ai / admin123
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={fillUserCredentials}
                      className="w-full flex items-center gap-2.5 p-2 rounded-md border border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left group"
                    >
                      <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 shrink-0">
                        <Sparkles className="size-4 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">User</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                            PRO
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          user@davinci.ai / user123
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="John Doe"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="you@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirm Password</Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Guest access */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-border/50 hover:bg-accent/50 hover:border-emerald-500/30"
              onClick={handleGuest}
              disabled={isLoading}
            >
              Continue as Guest
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
