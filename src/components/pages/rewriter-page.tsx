'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  RefreshCw,
  Sparkles,
  Copy,
  Download,
  FileText,
  Loader2,
  Check,
  Cpu,
  ArrowRightLeft,
  Languages,
  Palette,
  Sliders,
  Columns2,
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

const TONE_OPTIONS = [
  'Professional',
  'Casual',
  'Academic',
  'Creative',
  'Formal',
  'Friendly',
  'Persuasive',
]

const CREATIVITY_LEVELS = [
  { value: 'conservative', label: 'Conservative', description: 'Stay close to original' },
  { value: 'balanced', label: 'Balanced', description: 'Moderate changes' },
  { value: 'creative', label: 'Creative', description: 'More creative freedom' },
]

const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Japanese',
  'Portuguese',
  'Italian',
]

// ─── Diff highlight helper ────────────────────────────────────────────────────

function SimpleDiff({ original, rewritten }: { original: string; rewritten: string }) {
  const origWords = original.split(/\s+/)
  const newWords = rewritten.split(/\s+/)

  // Simple word-level diff: show the rewritten text with "new" segments highlighted
  // For a basic approach, just highlight the entire rewritten text as new additions
  // relative to original structure. A proper diff would need a diff algorithm.
  // Here we do a simple approach: split into sentences and highlight additions.

  const origSentences = original.split(/(?<=[.!?])\s+/).map((s) => s.trim().toLowerCase())
  const rewrittenSentences = rewritten.split(/(?<=[.!?])\s+/).map((s) => s.trim())

  return (
    <div className="text-sm leading-relaxed">
      {rewrittenSentences.map((sentence, idx) => {
        const isSimilar = origSentences.some(
          (os) =>
            os &&
            sentence.toLowerCase() &&
            (os.includes(sentence.toLowerCase().slice(0, 30)) ||
              sentence.toLowerCase().includes(os.slice(0, 30)))
        )
        return (
          <span key={idx}>
            {isSimilar ? (
              <span>{sentence} </span>
            ) : (
              <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 px-0.5 rounded">
                {sentence}
              </span>
            )}{' '}
          </span>
        )
      })}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RewriterPage() {
  const { user } = useAppStore()

  // Input state
  const [originalText, setOriginalText] = useState('')
  const [selectedTone, setSelectedTone] = useState('Professional')
  const [creativityLevel, setCreativityLevel] = useState('balanced')
  const [selectedLanguage, setSelectedLanguage] = useState('English')
  const [selectedModel, setSelectedModel] = useState('nvidia/llama-3.3-nemotron-super-49b-v1')

  // Output state
  const [rewrittenText, setRewrittenText] = useState('')
  const [rewriting, setRewriting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'diff' | 'side-by-side' | 'result'>('diff')

  // ─── Rewrite handler ────────────────────────────────────────────────────

  const handleRewrite = useCallback(async () => {
    if (!originalText.trim()) {
      toast.error('Please enter text to rewrite')
      return
    }

    setRewriting(true)
    setRewrittenText('')

    try {
      const creativityPrompt: Record<string, string> = {
        conservative:
          'Stay very close to the original text. Make minimal changes, only improving clarity and fixing awkward phrasing.',
        balanced:
          'Make moderate changes to improve the text while preserving the core meaning and structure.',
        creative:
          'Feel free to significantly restructure and reimagine the text while keeping the core message.',
      }

      const res = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'rewriter-tool',
          inputs: { text: originalText },
          tone: selectedTone,
          language: selectedLanguage,
          length: 'medium',
          model: selectedModel,
          customPrompt: `Rewrite the following text with these requirements:
- Tone: ${selectedTone}
- Language: ${selectedLanguage}
- Creativity level: ${creativityPrompt[creativityLevel] || creativityPrompt.balanced}

Return only the rewritten text, no explanations or meta-commentary.

Original text:
${originalText}`,
        }),
      })

      if (!res.ok) throw new Error('Rewrite failed')
      const data = await res.json()
      setRewrittenText(data.content || '')
      toast.success('Text rewritten successfully!')
    } catch {
      toast.error('Failed to rewrite text. Please try again.')
    } finally {
      setRewriting(false)
    }
  }, [originalText, selectedTone, creativityLevel, selectedLanguage, selectedModel])

  // ─── Export handlers ─────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rewrittenText)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }, [rewrittenText])

  const handleDownload = useCallback(() => {
    const blob = new Blob([rewrittenText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rewritten-content.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded as text file')
  }, [rewrittenText])

  // ─── Stats ──────────────────────────────────────────────────────────────

  const originalWords = originalText.split(/\s+/).filter(Boolean).length
  const rewrittenWords = rewrittenText.split(/\s+/).filter(Boolean).length

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
            <ArrowRightLeft className="size-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Rewriter</h1>
            <p className="text-sm text-muted-foreground">
              Rewrite content with different tones and creativity levels
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: Input & Options */}
        <div className="w-full lg:w-1/2 space-y-4">
          {/* Original Text */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Original Text</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder="Paste the text you want to rewrite here..."
                className="min-h-[200px] resize-y text-sm"
              />
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{originalWords} words</span>
                <span>{originalText.length} characters</span>
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Sliders className="size-3.5 text-emerald-500" />
                Rewrite Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tone */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Palette className="size-3" /> Tone
                </Label>
                <Select value={selectedTone} onValueChange={setSelectedTone}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((tone) => (
                      <SelectItem key={tone} value={tone}>
                        {tone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Creativity Level */}
              <div className="space-y-1.5">
                <Label className="text-xs">Creativity Level</Label>
                <div className="flex gap-2">
                  {CREATIVITY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setCreativityLevel(level.value)}
                      className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all border ${
                        creativityLevel === level.value
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-secondary text-muted-foreground border-border hover:border-emerald-500/30'
                      }`}
                    >
                      <div>{level.label}</div>
                      <div className="text-[9px] opacity-80 mt-0.5">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Languages className="size-3" /> Language
                </Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Cpu className="size-3" /> Model
                </Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full text-sm">
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

              {/* Rewrite Button */}
              <Button
                onClick={handleRewrite}
                disabled={!originalText.trim() || rewriting}
                className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
              >
                {rewriting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Rewriting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4 mr-2" />
                    Rewrite Text
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Output */}
        <div className="w-full lg:w-1/2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Rewritten Text</CardTitle>
                {rewrittenText && (
                  <div className="flex items-center gap-1.5">
                    {/* View mode toggles */}
                    <Button
                      variant={viewMode === 'diff' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('diff')}
                      className="h-7 text-[10px] gap-1"
                    >
                      Diff
                    </Button>
                    <Button
                      variant={viewMode === 'side-by-side' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('side-by-side')}
                      className="h-7 text-[10px] gap-1"
                    >
                      <Columns2 className="size-3" />
                      Compare
                    </Button>
                    <Button
                      variant={viewMode === 'result' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('result')}
                      className="h-7 text-[10px] gap-1"
                    >
                      Result
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {rewriting ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="size-8 text-emerald-500 animate-spin mb-3" />
                  <p className="text-sm text-muted-foreground">Rewriting your text...</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0ms]" />
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              ) : rewrittenText ? (
                <>
                  {/* Stats */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">
                      {rewrittenWords} words
                    </Badge>
                    {originalWords > 0 && (
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          rewrittenWords > originalWords
                            ? 'text-emerald-600'
                            : rewrittenWords < originalWords
                            ? 'text-amber-600'
                            : ''
                        }`}
                      >
                        {rewrittenWords > originalWords
                          ? `+${rewrittenWords - originalWords} words`
                          : rewrittenWords < originalWords
                          ? `${rewrittenWords - originalWords} words`
                          : 'Same length'}
                      </Badge>
                    )}
                  </div>

                  {/* View Modes */}
                  {viewMode === 'diff' && (
                    <ScrollArea className="max-h-[500px]">
                      <div className="p-4 rounded-lg border bg-muted/20">
                        <SimpleDiff original={originalText} rewritten={rewrittenText} />
                      </div>
                    </ScrollArea>
                  )}

                  {viewMode === 'side-by-side' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <ScrollArea className="max-h-[500px]">
                        <div className="p-3 rounded-lg border bg-muted/20">
                          <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase">
                            Original
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{originalText}</p>
                        </div>
                      </ScrollArea>
                      <ScrollArea className="max-h-[500px]">
                        <div className="p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-500/20">
                          <p className="text-[10px] font-medium text-emerald-600 uppercase mb-2">
                            Rewritten
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{rewrittenText}</p>
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {viewMode === 'result' && (
                    <ScrollArea className="max-h-[500px]">
                      <Card className="border-emerald-500/10">
                        <CardContent className="p-4">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{rewrittenText}</ReactMarkdown>
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollArea>
                  )}

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="gap-1.5 text-xs"
                    >
                      {copied ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="gap-1.5 text-xs"
                    >
                      <Download className="size-3.5" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRewrite}
                      disabled={rewriting}
                      className="gap-1.5 text-xs"
                    >
                      <RefreshCw
                        className={`size-3.5 ${rewriting ? 'animate-spin' : ''}`}
                      />
                      Regenerate
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ArrowRightLeft className="size-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Rewritten text will appear here
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Enter your text on the left and click &quot;Rewrite Text&quot;
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
