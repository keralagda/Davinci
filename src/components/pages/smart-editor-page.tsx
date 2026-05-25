'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PenTool,
  Sparkles,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  AlignLeft,
  Copy,
  Download,
  FileText,
  Loader2,
  Check,
  Cpu,
  Wand2,
  Type,
  MessageSquare,
  SpellCheck,
  Minimize2,
  Maximize2,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL_OPTIONS = [
  { value: 'nvidia/llama-3.3-nemotron-super-49b-v1', label: 'Nemotron Super 49B' },
  { value: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', label: 'Nemotron Ultra 253B' },
  { value: 'meta/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
  { value: 'mistralai/mistral-nemotron', label: 'Mistral Nemotron' },
  { value: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1' },
  { value: '@cf/meta/llama-3-8b-instruct', label: 'Llama 3 8B (Fast)' },
]

const TONE_OPTIONS = ['Professional', 'Casual', 'Academic', 'Creative']

const AI_TOOLS = [
  {
    id: 'continue',
    label: 'Continue Writing',
    icon: ArrowRight,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    description: 'AI continues writing from where you left off',
  },
  {
    id: 'improve',
    label: 'Improve Writing',
    icon: Wand2,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    description: 'Enhance clarity, flow, and style',
  },
  {
    id: 'grammar',
    label: 'Fix Grammar',
    icon: SpellCheck,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    description: 'Correct grammar, spelling, and punctuation',
  },
  {
    id: 'shorter',
    label: 'Make Shorter',
    icon: Minimize2,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    description: 'Condense while keeping key points',
  },
  {
    id: 'longer',
    label: 'Make Longer',
    icon: Maximize2,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    description: 'Expand with more detail and examples',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    icon: AlignLeft,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    description: 'Create a concise summary',
  },
] as const

// ─── Component ────────────────────────────────────────────────────────────────

export function SmartEditorPage() {
  const { user } = useAppStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Editor state
  const [content, setContent] = useState('')
  const [selectedModel, setSelectedModel] = useState('nvidia/llama-3.3-nemotron-super-49b-v1')
  const [selectedTone, setSelectedTone] = useState('Professional')

  // AI state
  const [aiProcessing, setAiProcessing] = useState(false)
  const [activeTool, setActiveTool] = useState<string | null>(null)

  // Export state
  const [copied, setCopied] = useState(false)

  // ─── Formatting helpers ──────────────────────────────────────────────────

  const wrapSelection = useCallback(
    (prefix: string, suffix: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = content.substring(start, end)

      if (!selectedText) {
        toast.info('Select text to format')
        return
      }

      const newContent =
        content.substring(0, start) + prefix + selectedText + suffix + content.substring(end)
      setContent(newContent)

      // Restore cursor
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + prefix.length, end + prefix.length)
      }, 0)
    },
    [content]
  )

  const handleBold = useCallback(() => wrapSelection('**', '**'), [wrapSelection])
  const handleItalic = useCallback(() => wrapSelection('*', '*'), [wrapSelection])
  const handleHeading1 = useCallback(() => wrapSelection('# ', ''), [wrapSelection])
  const handleHeading2 = useCallback(() => wrapSelection('## ', ''), [wrapSelection])
  const handleList = useCallback(() => wrapSelection('- ', ''), [wrapSelection])
  const handleOrderedList = useCallback(() => wrapSelection('1. ', ''), [wrapSelection])

  // ─── AI Tool handler ────────────────────────────────────────────────────

  const handleAiTool = useCallback(
    async (toolId: string, tone?: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = content.substring(start, end)

      // For "continue", we don't need selection
      if (toolId !== 'continue' && !selectedText.trim()) {
        toast.info('Select text to use this AI tool')
        return
      }

      setAiProcessing(true)
      setActiveTool(toolId)

      try {
        let prompt = ''
        let textToProcess = toolId === 'continue' ? content : selectedText

        switch (toolId) {
          case 'continue':
            prompt = `Continue writing from where the text ends. Write 2-3 paragraphs that naturally follow the existing content. Maintain the same style and tone.\n\nExisting text:\n${textToProcess.slice(-2000)}`
            break
          case 'improve':
            prompt = `Improve the following text. Enhance clarity, flow, vocabulary, and style. ${tone ? `Use a ${tone} tone.` : ''} Return only the improved text, no explanations.\n\nText:\n${textToProcess}`
            break
          case 'grammar':
            prompt = `Fix all grammar, spelling, and punctuation errors in the following text. Return only the corrected text, no explanations.\n\nText:\n${textToProcess}`
            break
          case 'shorter':
            prompt = `Make the following text shorter and more concise while preserving the key points and meaning. Return only the shortened text.\n\nText:\n${textToProcess}`
            break
          case 'longer':
            prompt = `Expand the following text by adding more detail, examples, and explanations. ${tone ? `Use a ${tone} tone.` : ''} Return only the expanded text.\n\nText:\n${textToProcess}`
            break
          case 'summarize':
            prompt = `Summarize the following text in a concise way, capturing the key points. Return only the summary.\n\nText:\n${textToProcess}`
            break
        }

        const res = await fetch('/api/generate/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: 'smart-editor-tool',
            inputs: { text: textToProcess.slice(0, 3000) },
            tone: tone || selectedTone,
            language: 'English',
            length: 'medium',
            model: selectedModel,
            customPrompt: prompt,
          }),
        })

        if (!res.ok) throw new Error('AI processing failed')
        const data = await res.json()
        const result = data.content || ''

        if (toolId === 'continue') {
          // Append to end
          setContent((prev) => prev + '\n\n' + result)
        } else {
          // Replace selection
          const newContent =
            content.substring(0, start) + result + content.substring(end)
          setContent(newContent)
        }

        toast.success(`${AI_TOOLS.find((t) => t.id === toolId)?.label || 'AI tool'} completed!`)
      } catch {
        toast.error('AI processing failed. Please try again.')
      } finally {
        setAiProcessing(false)
        setActiveTool(null)
      }
    },
    [content, selectedModel, selectedTone]
  )

  const handleToneChange = useCallback(
    (tone: string) => {
      setSelectedTone(tone)
      // If there's selected text, apply the tone change
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = content.substring(start, end)

      if (selectedText.trim()) {
        handleAiTool('improve', tone)
      }
    },
    [content, handleAiTool]
  )

  // ─── Stats ──────────────────────────────────────────────────────────────

  const wordCount = content.split(/\s+/).filter(Boolean).length
  const charCount = content.length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  // ─── Export handlers ─────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }, [content])

  const handleDownloadText = useCallback(() => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded as text file')
  }, [content])

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <PenTool className="size-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Smart Editor</h1>
            <p className="text-sm text-muted-foreground">
              Write with AI-powered tools at your fingertips
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-4 min-h-[600px]">
        {/* Left: Editor */}
        <div className="flex-1 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-2 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <Type className="size-3.5 text-emerald-500" />
                  Editor
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="h-7 text-xs gap-1"
                  >
                    {copied ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadText}
                    className="h-7 text-xs gap-1"
                  >
                    <Download className="size-3" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Formatting Toolbar */}
            <div className="px-4 pb-2 shrink-0">
              <div className="flex items-center gap-1 p-1.5 rounded-lg border bg-muted/30">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleBold}
                  title="Bold"
                >
                  <Bold className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleItalic}
                  title="Italic"
                >
                  <Italic className="size-3.5" />
                </Button>
                <Separator orientation="vertical" className="h-5 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleHeading1}
                  title="Heading 1"
                >
                  <Heading1 className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleHeading2}
                  title="Heading 2"
                >
                  <Heading2 className="size-3.5" />
                </Button>
                <Separator orientation="vertical" className="h-5 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleList}
                  title="Bullet List"
                >
                  <List className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleOrderedList}
                  title="Numbered List"
                >
                  <ListOrdered className="size-3.5" />
                </Button>
              </div>
            </div>

            <CardContent className="flex-1 p-0 min-h-0">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your content here... Select text and use the AI tools on the right to enhance it."
                className="h-full min-h-[400px] resize-none border-0 rounded-none focus-visible:ring-0 text-sm leading-relaxed p-4"
              />
            </CardContent>

            {/* Bottom Stats Bar */}
            <div className="px-4 py-2 border-t bg-muted/20 shrink-0">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{wordCount} words</span>
                <span>{charCount} characters</span>
                <span>~{readingTime} min read</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: AI Tools Panel */}
        <div className="w-full lg:w-[300px] shrink-0">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-emerald-500" />
                AI Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Model Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Cpu className="size-3" /> Model
                </Label>
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

              <Separator />

              {/* AI Tool Buttons */}
              <div className="space-y-2">
                {AI_TOOLS.map((tool) => {
                  const Icon = tool.icon
                  const isActive = activeTool === tool.id
                  return (
                    <motion.button
                      key={tool.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleAiTool(tool.id)}
                      disabled={aiProcessing}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-border hover:border-emerald-500/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
                      } ${aiProcessing && !isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div
                        className={`flex size-8 items-center justify-center rounded-lg ${tool.bgColor}`}
                      >
                        {isActive ? (
                          <Loader2 className={`size-4 animate-spin ${tool.color}`} />
                        ) : (
                          <Icon className={`size-4 ${tool.color}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{tool.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {tool.description}
                        </p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              <Separator />

              {/* Change Tone */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <MessageSquare className="size-3" /> Change Tone
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between text-xs h-8"
                      disabled={aiProcessing}
                    >
                      {selectedTone}
                      <ChevronDown className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {TONE_OPTIONS.map((tone) => (
                      <DropdownMenuItem
                        key={tone}
                        onClick={() => handleToneChange(tone)}
                        className="text-xs"
                      >
                        {tone}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <p className="text-[10px] text-muted-foreground">
                  Select text first, then change tone to rewrite
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
