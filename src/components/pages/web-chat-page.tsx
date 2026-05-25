'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  Globe,
  Sparkles,
  Loader2,
  Send,
  MessageSquare,
  User,
  Cpu,
  ExternalLink,
  Search,
  FileText,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface PageInfo {
  title: string
  description: string
  contentLength: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL_OPTIONS = [
  { value: 'nvidia/llama-3.3-nemotron-super-49b-v1', label: 'Nemotron Super 49B' },
  { value: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', label: 'Nemotron Ultra 253B' },
  { value: 'meta/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
  { value: 'mistralai/mistral-nemotron', label: 'Mistral Nemotron' },
  { value: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1' },
  { value: '@cf/meta/llama-3-8b-instruct', label: 'Llama 3 8B (Fast)' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function WebChatPage() {
  const { user } = useAppStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // State
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('nvidia/llama-3.3-nemotron-super-49b-v1')

  // ─── Auto-scroll ─────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ─── Analyze URL ────────────────────────────────────────────────────────

  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      toast.error('Please enter a valid URL (including http:// or https://)')
      return
    }

    setAnalyzing(true)
    setPageInfo(null)
    setMessages([])

    try {
      // Send initial analysis request
      const res = await fetch('/api/web-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          message: 'Provide a comprehensive summary of this web page, including the main topics, key points, and any important details.',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to analyze URL')
      }

      const data = await res.json()
      setPageInfo({
        title: data.pageTitle || url,
        description: data.pageDescription || '',
        contentLength: data.contentLength || 0,
      })

      // Add the analysis as first assistant message
      setMessages([
        {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: data.response || 'No analysis available.',
          timestamp: new Date(),
        },
      ])

      toast.success('Page analyzed successfully!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to analyze URL. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }, [url])

  // ─── Send chat message ──────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading || !pageInfo) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/web-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, message: trimmed }),
      })

      if (!res.ok) throw new Error('Failed to get response')
      const data = await res.json()

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: data.response || 'No response received.',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      toast.error('Failed to get a response. Please try again.')
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
      setInputValue(trimmed)
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, pageInfo, url])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Globe className="size-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Web Chat</h1>
            <p className="text-sm text-muted-foreground">
              Share a URL and chat about the webpage contents
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-4 min-h-[500px]">
        {/* Left: URL Input & Page Info */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-4">
          {/* URL Input */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Search className="size-3.5 text-emerald-500" />
                Web Page URL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="text-sm h-9"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAnalyze()
                  }}
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={!url.trim() || analyzing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 shrink-0"
                >
                  {analyzing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ExternalLink className="size-4" />
                  )}
                </Button>
              </div>

              {/* Model Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-xs font-medium">
                  <Cpu className="size-3 text-emerald-500" />
                  Model
                </div>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Page Info */}
          {pageInfo && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <FileText className="size-3.5 text-emerald-500" />
                  Page Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs font-medium">{pageInfo.title}</p>
                  {pageInfo.description && (
                    <p className="text-[10px] text-muted-foreground line-clamp-3 mt-1">
                      {pageInfo.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[9px]">
                    {pageInfo.contentLength.toLocaleString()} chars
                  </Badge>
                  <Badge variant="secondary" className="text-[9px]">
                    Analyzed
                  </Badge>
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-emerald-600 hover:underline flex items-center gap-1 truncate"
                >
                  <ExternalLink className="size-2.5 shrink-0" />
                  {url}
                </a>
              </CardContent>
            </Card>
          )}

          {/* Suggested Questions */}
          {pageInfo && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Suggested Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {[
                  'What is the main topic of this page?',
                  'Summarize the key points',
                  'What are the main arguments?',
                  'Extract important facts or data',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInputValue(q)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs border border-border hover:border-emerald-500/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors text-muted-foreground"
                  >
                    {q}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Chat Interface */}
        <div className="flex-1 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            {/* Chat Messages */}
            <div className="flex-1 overflow-hidden">
              {!pageInfo && !analyzing ? (
                <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4 mx-auto">
                      <Globe className="h-8 w-8 text-emerald-600" />
                    </div>
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">
                    Analyze a Web Page
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Enter a URL on the left and click Analyze. Then ask questions
                    about the page content and get AI-powered answers.
                  </p>
                </div>
              ) : analyzing ? (
                <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                  <Loader2 className="size-10 text-emerald-500 animate-spin mb-4" />
                  <h3 className="text-lg font-semibold mb-1">
                    Analyzing Page...
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Fetching and processing content from the URL. This may take a
                    moment.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-start gap-3 ${
                          message.role === 'user' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback
                            className={
                              message.role === 'user'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-100 dark:bg-emerald-900/30'
                            }
                          >
                            {message.role === 'user' ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-emerald-600" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-emerald-600 text-white rounded-tr-sm'
                              : 'bg-muted rounded-tl-sm'
                          }`}
                        >
                          {message.role === 'user' ? (
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                          ) : (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-pre:bg-background/50 prose-code:text-emerald-600 dark:prose-code:text-emerald-400">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <div className="flex items-start gap-3">
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
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: 0,
                              }}
                            />
                            <motion.span
                              className="w-2 h-2 bg-emerald-500 rounded-full"
                              animate={{ y: [0, -6, 0] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: 0.15,
                              }}
                            />
                            <motion.span
                              className="w-2 h-2 bg-emerald-500 rounded-full"
                              animate={{ y: [0, -6, 0] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: 0.3,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t p-4 shrink-0">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      pageInfo
                        ? 'Ask about this web page...'
                        : 'Analyze a URL first to start chatting...'
                    }
                    className="resize-none min-h-[44px] max-h-[120px] rounded-xl focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                    rows={1}
                    disabled={isLoading || !pageInfo}
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading || !pageInfo}
                  size="icon"
                  className="h-11 w-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-30"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
