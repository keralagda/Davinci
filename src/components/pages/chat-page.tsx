'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Sparkles,
  X,
  Menu,
  Code,
  PenTool,
  Megaphone,
  Search as SearchIcon,
  Briefcase,
  GraduationCap,
  MessageSquare,
  ArrowUp,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

// Types
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface Conversation {
  id: string
  title: string
  assistantType: string
  createdAt: string
  updatedAt: string
  lastMessage: string | null
  lastMessageAt: string | null
}

interface ChatResponse {
  conversationId: string
  message: {
    id: string
    role: 'assistant'
    content: string
    createdAt: string
  }
}

// Assistant types config
const ASSISTANT_TYPES = [
  { value: 'general', label: 'General', icon: MessageSquare, color: 'text-emerald-600' },
  { value: 'coder', label: 'Coder', icon: Code, color: 'text-teal-600' },
  { value: 'writer', label: 'Writer', icon: PenTool, color: 'text-amber-600' },
  { value: 'marketing', label: 'Marketing', icon: Megaphone, color: 'text-rose-600' },
  { value: 'seo', label: 'SEO', icon: SearchIcon, color: 'text-cyan-600' },
  { value: 'business', label: 'Business', icon: Briefcase, color: 'text-violet-600' },
  { value: 'tutor', label: 'Tutor', icon: GraduationCap, color: 'text-orange-600' },
] as const

const SUGGESTED_PROMPTS = [
  'Write a blog post about AI trends',
  'Explain quantum computing simply',
  'Create a marketing strategy',
  'Help me debug my code',
]

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 mb-4">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30">
          <Sparkles className="h-4 w-4 text-emerald-600" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center">
          <motion.span
            className="w-2 h-2 bg-emerald-500 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.span
            className="w-2 h-2 bg-emerald-500 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
          />
          <motion.span
            className="w-2 h-2 bg-emerald-500 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          />
        </div>
      </div>
    </div>
  )
}

// Message bubble component
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={
            isUser
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-100 dark:bg-emerald-900/30'
          }
        >
          {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-emerald-600" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-emerald-600 text-white rounded-tr-sm'
            : 'bg-muted rounded-tl-sm'
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-pre:bg-background/50 prose-pre:border prose-code:text-emerald-600 dark:prose-code:text-emerald-400">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Conversation list item
function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
}: {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      onClick={onClick}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
          : 'hover:bg-muted/50'
      }`}
    >
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            isActive
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-foreground'
          }`}
        >
          {conversation.title}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {conversation.lastMessage ?? 'No messages yet'}
        </p>
      </div>
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Sidebar content (shared between desktop and mobile)
function SidebarContent({
  conversations,
  activeConversationId,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
}: {
  conversations: Conversation[]
  activeConversationId: string | null
  searchQuery: string
  onSearchChange: (q: string) => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onNewChat: () => void
}) {
  const filtered = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-3">
        <Button
          onClick={onNewChat}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </p>
          ) : (
            filtered.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={activeConversationId === conv.id}
                onClick={() => onSelectConversation(conv.id)}
                onDelete={() => onDeleteConversation(conv.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Main chat page component
export function ChatPage() {
  const { activeConversationId, setActiveConversationId } = useAppStore()

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedModel, setSelectedModel] = useState('nvidia/llama-3.1-nemotron-70b-instruct')
  const [assistantType, setAssistantType] = useState('general')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [loadingConversation, setLoadingConversation] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const currentConversationId = useRef<string | null>(activeConversationId)

  // Sync ref with state
  useEffect(() => {
    currentConversationId.current = activeConversationId
  }, [activeConversationId])

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // Fetch conversation history
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/history')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations ?? [])
      }
    } catch {
      // silently fail
    }
  }, [])

  // Load a conversation
  const loadConversation = useCallback(
    async (id: string) => {
      setLoadingConversation(true)
      try {
        const res = await fetch(`/api/chat/${id}`)
        if (res.ok) {
          const data = await res.json()
          setMessages(
            data.conversation.messages.map((m: Message) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              createdAt: m.createdAt,
            }))
          )
          setActiveConversationId(id)
          if (data.conversation.assistantType) {
            setAssistantType(data.conversation.assistantType)
          }
        }
      } catch {
        toast.error('Failed to load conversation')
      } finally {
        setLoadingConversation(false)
      }
    },
    [setActiveConversationId]
  )

  // Load conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Load active conversation on mount
  useEffect(() => {
    if (activeConversationId && messages.length === 0) {
      loadConversation(activeConversationId)
    }
  }, [])

  // Send message
  const sendMessage = useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversationId: currentConversationId.current ?? undefined,
          assistantType,
          model: selectedModel,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to send message')
      }

      const data: ChatResponse = await res.json()

      // Set conversation ID if new
      if (!currentConversationId.current) {
        setActiveConversationId(data.conversationId)
        currentConversationId.current = data.conversationId
      }

      // Add assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: data.message.id,
          role: 'assistant',
          content: data.message.content,
          createdAt: data.message.createdAt,
        },
      ])

      // Refresh conversation list
      fetchConversations()
    } catch {
      toast.error('Failed to send message. Please try again.')
      // Remove the user message on failure
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
      setInputValue(trimmed)
    } finally {
      setIsLoading(false)
      // Refocus textarea
      textareaRef.current?.focus()
    }
  }, [inputValue, isLoading, assistantType, selectedModel, setActiveConversationId, fetchConversations])

  // New chat
  const handleNewChat = useCallback(() => {
    setMessages([])
    setActiveConversationId(null)
    currentConversationId.current = null
    setMobileSidebarOpen(false)
    setAssistantType('general')
    setInputValue('')
  }, [setActiveConversationId])

  // Delete conversation
  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/chat/${id}`, { method: 'DELETE' })
        if (activeConversationId === id) {
          handleNewChat()
        }
        fetchConversations()
        toast.success('Conversation deleted')
      } catch {
        toast.error('Failed to delete conversation')
      }
    },
    [activeConversationId, handleNewChat, fetchConversations]
  )

  // Select conversation
  const handleSelectConversation = useCallback(
    (id: string) => {
      loadConversation(id)
      setMobileSidebarOpen(false)
    },
    [loadConversation]
  )

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px'
  }

  const currentAssistant = ASSISTANT_TYPES.find((t) => t.value === assistantType)
  const AssistantIcon = currentAssistant?.icon ?? MessageSquare

  return (
    <div className="flex h-full bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-[280px] shrink-0 border-r flex-col bg-muted/30">
        <SidebarContent
          conversations={conversations}
          activeConversationId={activeConversationId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-background/95 backdrop-blur-sm">
          {/* Mobile menu button */}
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Conversations</SheetTitle>
              </SheetHeader>
              <SidebarContent
                conversations={conversations}
                activeConversationId={activeConversationId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectConversation={handleSelectConversation}
                onDeleteConversation={handleDeleteConversation}
                onNewChat={handleNewChat}
              />
            </SheetContent>
          </Sheet>

          {/* Assistant type badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
            >
              <AssistantIcon className="h-3.5 w-3.5" />
              {currentAssistant?.label ?? 'General'}
            </Badge>
          </div>

          <div className="flex-1" />

          {/* Model selector */}
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nvidia/llama-3.1-nemotron-70b-instruct">Nemotron 70B</SelectItem>
              <SelectItem value="meta/llama-3.1-405b-instruct">Llama 3.1 405B</SelectItem>
              <SelectItem value="meta/llama-3.1-70b-instruct">Llama 3.1 70B</SelectItem>
              <SelectItem value="mistralai/mixtral-8x22b-instruct">Mixtral 8x22B</SelectItem>
              <SelectItem value="deepseek-ai/deepseek-r1">DeepSeek R1</SelectItem>
              <SelectItem value="google/gemma-2-27b-it">Gemma 2 27B</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden relative">
          {loadingConversation ? (
            <div className="flex items-center justify-center h-full">
              <div className="space-y-3">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
              </div>
            </div>
          ) : messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-6 mx-auto">
                  <Sparkles className="h-8 w-8 text-emerald-600" />
                </div>
              </motion.div>
              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-2xl font-bold text-foreground mb-2"
              >
                Start a Conversation
              </motion.h2>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-muted-foreground mb-8 max-w-md"
              >
                Choose an assistant type and start chatting. Try one of these suggestions:
              </motion.p>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full"
              >
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInputValue(prompt)
                      textareaRef.current?.focus()
                    }}
                    className="text-left px-4 py-3 rounded-xl border border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors text-sm text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </motion.div>
            </div>
          ) : (
            /* Chat Messages */
            <ScrollArea className="h-full">
              <div className="max-w-3xl mx-auto px-4 py-6">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-background/95 backdrop-blur-sm p-4">
          <div className="max-w-3xl mx-auto">
            {/* Assistant type selector row */}
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
              {ASSISTANT_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    onClick={() => setAssistantType(type.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                      assistantType === type.value
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {type.label}
                  </button>
                )
              })}
            </div>

            {/* Input row */}
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="resize-none pr-12 min-h-[44px] max-h-[160px] rounded-xl border-border focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="absolute bottom-2 right-2 h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
