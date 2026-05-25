'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  FileSearch,
  Upload,
  FileText,
  Sparkles,
  Loader2,
  X,
  Send,
  File,
  MessageSquare,
  User,
  Cpu,
  Plus,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

interface UploadedFile {
  name: string
  size: number
  type: string
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

const ACCEPTED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/json',
  'text/markdown',
]

const ACCEPTED_EXTENSIONS = ['.pdf', '.txt', '.csv', '.docx', '.json', '.md']

// ─── Component ────────────────────────────────────────────────────────────────

export function FileChatPage() {
  const { user } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileInfo, setFileInfo] = useState<UploadedFile | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('nvidia/llama-3.3-nemotron-super-49b-v1')
  const [dragOver, setDragOver] = useState(false)

  // ─── Auto-scroll ─────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ─── File handling ───────────────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    const isValidType =
      ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext)

    if (!isValidType) {
      toast.error('Please upload a valid file (PDF, DOCX, CSV, TXT, JSON, MD)')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File must be less than 20MB')
      return
    }

    setUploadedFile(file)
    setFileInfo({
      name: file.name,
      size: file.size,
      type: file.type || ext,
    })
    // Reset messages when changing file
    setMessages([])
    toast.success(`File "${file.name}" uploaded`)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const clearFile = useCallback(() => {
    setUploadedFile(null)
    setFileInfo(null)
    setMessages([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // ─── Send message ───────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading) return

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
      const formData = new FormData()
      formData.append('message', trimmed)
      if (uploadedFile) {
        formData.append('file', uploadedFile)
      }

      const res = await fetch('/api/file-chat', {
        method: 'POST',
        body: formData,
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
      // Remove the user message on failure
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
      setInputValue(trimmed)
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, uploadedFile])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ─── Format file size ───────────────────────────────────────────────────

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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
            <FileSearch className="size-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">File Chat</h1>
            <p className="text-sm text-muted-foreground">
              Upload documents and chat about their contents
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-4 min-h-[500px]">
        {/* Left: Upload & File Info */}
        <div className="w-full lg:w-[300px] shrink-0 space-y-4">
          {/* Upload Area */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Upload className="size-3.5 text-emerald-500" />
                Upload File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!fileInfo ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center py-8 px-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                    dragOver
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
                      : 'border-muted-foreground/25 hover:border-emerald-500/50'
                  }`}
                >
                  <File className="size-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Drop file here or click to browse
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center">
                    {['PDF', 'DOCX', 'CSV', 'TXT'].map((fmt) => (
                      <Badge key={fmt} variant="secondary" className="text-[9px]">
                        {fmt}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 shrink-0">
                    <FileText className="size-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{fileInfo.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatSize(fileInfo.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={clearFile}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.csv,.docx,.json,.md"
                onChange={handleFileSelect}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Model Selector */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
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

          {/* Suggested Questions */}
          {fileInfo && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Suggested Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {[
                  'Summarize this document',
                  'What are the key points?',
                  'Extract important data',
                  'What is the main topic?',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInputValue(q)
                    }}
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
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4 mx-auto">
                      <MessageSquare className="h-8 w-8 text-emerald-600" />
                    </div>
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">
                    Chat About Your Document
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {fileInfo
                      ? `Ask questions about "${fileInfo.name}" and get AI-powered answers based on the document content.`
                      : 'Upload a document first, then ask questions about its content.'}
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
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t p-4 shrink-0">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      fileInfo
                        ? 'Ask about your document...'
                        : 'Upload a document to start chatting...'
                    }
                    className="resize-none min-h-[44px] max-h-[120px] rounded-xl focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                    rows={1}
                    disabled={isLoading || !fileInfo}
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading || !fileInfo}
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
