'use client'

import { useTheme } from 'next-themes'
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  LayoutDashboard,
  PenLine,
  MessageSquare,
  ImageIcon,
  Code2,
  Mic,
  Volume2,
  FileText,
  CreditCard,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAppStore, type Page } from '@/lib/store'

const pageTitles: Record<Page, string> = {
  dashboard: 'Dashboard',
  writer: 'AI Writer',
  chat: 'AI Chat',
  image: 'AI Image',
  code: 'AI Code',
  'speech-to-text': 'Speech to Text',
  'text-to-speech': 'Text to Speech',
  documents: 'My Documents',
  pricing: 'Pricing',
  settings: 'Settings',
  admin: 'Admin',
}

const pageIcons: Record<Page, React.ElementType> = {
  dashboard: LayoutDashboard,
  writer: PenLine,
  chat: MessageSquare,
  image: ImageIcon,
  code: Code2,
  'speech-to-text': Mic,
  'text-to-speech': Volume2,
  documents: FileText,
  pricing: CreditCard,
  settings: Settings,
  admin: Settings,
}

export function AppHeader() {
  const { activePage, user, setUser } = useAppStore()
  const { theme, setTheme } = useTheme()

  const pageTitle = pageTitles[activePage] || 'Dashboard'
  const PageIcon = pageIcons[activePage] || LayoutDashboard

  const handleLogout = () => {
    setUser(null)
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4 md:px-6">
      {/* Mobile menu toggle */}
      <SidebarTrigger className="-ml-1 md:hidden" />

      {/* Page title */}
      <div className="flex items-center gap-2 min-w-0">
        <PageIcon className="size-5 text-emerald-500 shrink-0 hidden sm:block" />
        <h1 className="text-lg font-semibold truncate">{pageTitle}</h1>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search bar - decorative for now */}
      <div className="hidden md:flex items-center relative max-w-sm w-full">
        <Search className="absolute left-2.5 size-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-emerald-500/50"
        />
      </div>

      {/* Dark mode toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="size-9 text-muted-foreground hover:text-foreground"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* Notification bell */}
      <Button
        variant="ghost"
        size="icon"
        className="size-9 text-muted-foreground hover:text-foreground relative"
      >
        <Bell className="size-4" />
        <Badge className="absolute -top-0.5 -right-0.5 size-4 p-0 flex items-center justify-center text-[10px] bg-emerald-500 text-white border-2 border-background">
          3
        </Badge>
        <span className="sr-only">Notifications</span>
      </Button>

      {/* User avatar dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="size-9 rounded-full p-0 hover:bg-accent"
          >
            <Avatar className="size-8 border border-border">
              <AvatarImage
                src={user?.image || ''}
                alt={user?.name || 'User'}
              />
              <AvatarFallback className="bg-emerald-600 text-white text-xs">
                {user?.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Settings className="mr-2 size-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="mr-2 size-4" />
            Subscription
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <span className="mr-2">Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
