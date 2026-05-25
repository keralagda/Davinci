'use client'

import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  PenLine,
  Wand2,
  FileEdit,
  RefreshCw,
  MessageSquare,
  ImageIcon,
  Code2,
  Eye,
  FileSearch,
  Globe,
  Mic,
  Volume2,
  FileText,
  CreditCard,
  Settings,
  Sparkles,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  Crown,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore, type Page } from '@/lib/store'

const mainNavItems: { title: string; icon: React.ElementType; page: Page }[] = [
  { title: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
  { title: 'AI Writer', icon: PenLine, page: 'writer' },
  { title: 'Article Wizard', icon: Wand2, page: 'article-wizard' },
  { title: 'Smart Editor', icon: FileEdit, page: 'smart-editor' },
  { title: 'AI Rewriter', icon: RefreshCw, page: 'rewriter' },
  { title: 'AI Chat', icon: MessageSquare, page: 'chat' },
  { title: 'AI Image', icon: ImageIcon, page: 'image' },
  { title: 'AI Code', icon: Code2, page: 'code' },
]

const toolsNavItems: { title: string; icon: React.ElementType; page: Page }[] = [
  { title: 'AI Vision', icon: Eye, page: 'ai-vision' },
  { title: 'File Chat', icon: FileSearch, page: 'file-chat' },
  { title: 'Web Chat', icon: Globe, page: 'web-chat' },
]

const mediaNavItems: { title: string; icon: React.ElementType; page: Page }[] = [
  { title: 'Speech to Text', icon: Mic, page: 'speech-to-text' },
  { title: 'Text to Speech', icon: Volume2, page: 'text-to-speech' },
]

const accountNavItems: { title: string; icon: React.ElementType; page: Page }[] = [
  { title: 'My Documents', icon: FileText, page: 'documents' },
  { title: 'Pricing', icon: CreditCard, page: 'pricing' },
  { title: 'Settings', icon: Settings, page: 'settings' },
]

const adminNavItems: { title: string; icon: React.ElementType; page: Page }[] = [
  { title: 'Admin Panel', icon: ShieldCheck, page: 'admin' },
]

function getPlanBadge(plan: string) {
  switch (plan) {
    case 'enterprise':
      return { label: 'Enterprise', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0' }
    case 'professional':
    case 'monthly':
    case 'yearly':
      return { label: 'Pro', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0' }
    case 'starter':
      return { label: 'Starter', class: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-0' }
    default:
      return { label: 'Free', class: 'bg-muted text-muted-foreground border-0' }
  }
}

export function AppSidebar() {
  const { activePage, setActivePage, user, setUser } = useAppStore()
  const { theme, setTheme } = useTheme()

  const isAdmin = user?.role === 'admin'
  const handleLogout = () => {
    setUser(null)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const planBadge = getPlanBadge(user?.plan || 'free')

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Logo Section */}
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-transparent cursor-default"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <Sparkles className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-bold text-base bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Davinci AI
                </span>
                <span className="text-[10px] text-muted-foreground">
                  NVIDIA AI Platform
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="custom-scrollbar">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    isActive={activePage === item.page}
                    onClick={() => setActivePage(item.page)}
                    tooltip={item.title}
                    className={
                      activePage === item.page
                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400 font-medium'
                        : ''
                    }
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Tools Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>AI Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNavItems.map((item) => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    isActive={activePage === item.page}
                    onClick={() => setActivePage(item.page)}
                    tooltip={item.title}
                    className={
                      activePage === item.page
                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400 font-medium'
                        : ''
                    }
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Media Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Media</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mediaNavItems.map((item) => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    isActive={activePage === item.page}
                    onClick={() => setActivePage(item.page)}
                    tooltip={item.title}
                    className={
                      activePage === item.page
                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400 font-medium'
                        : ''
                    }
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNavItems.map((item) => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    isActive={activePage === item.page}
                    onClick={() => setActivePage(item.page)}
                    tooltip={item.title}
                    className={
                      activePage === item.page
                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400 font-medium'
                        : ''
                    }
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Navigation - Only visible to admin users */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-amber-500 dark:text-amber-400">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.page}>
                    <SidebarMenuButton
                      isActive={activePage === item.page}
                      onClick={() => setActivePage(item.page)}
                      tooltip={item.title}
                      className={
                        activePage === item.page
                          ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/20 hover:text-amber-400 font-medium'
                          : ''
                      }
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarSeparator />

      {/* Footer with User Info and Dark Mode Toggle */}
      <SidebarFooter className="p-3">
        <SidebarMenu>
          {/* Dark Mode Toggle */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleTheme}
              tooltip={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              className="mb-1"
            >
              {theme === 'dark' ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* User Section */}
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="relative">
                <Avatar className="size-8 border border-sidebar-border">
                  <AvatarImage
                    src={user?.image || ''}
                    alt={user?.name || 'User'}
                  />
                  <AvatarFallback className={`${isAdmin ? 'bg-amber-600' : 'bg-emerald-600'} text-white text-xs`}>
                    {user?.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isAdmin && (
                  <div className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-amber-500 border-2 border-sidebar flex items-center justify-center">
                    <Crown className="size-2 text-white" />
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">
                    {user?.name || 'User'}
                  </span>
                  <Badge variant="secondary" className={`text-[9px] px-1 py-0 ${planBadge.class}`}>
                    {planBadge.label}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email || 'user@example.com'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:hidden"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
