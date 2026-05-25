'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  Code2,
  Play,
  Copy,
  Loader2,
  Sparkles,
  History,
  ChevronRight,
  FileCode2,
  Trash2,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CodeHistoryItem {
  id: string
  prompt: string
  language: string
  code: string
  explanation: string
  timestamp: number
}

// ─── Languages ────────────────────────────────────────────────────────────────

const LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'Go',
  'Rust',
  'PHP',
  'Ruby',
  'Swift',
  'Kotlin',
  'SQL',
  'HTML/CSS',
  'Other',
]

// Map language names to syntax highlighter language IDs
const langToSyntax: Record<string, string> = {
  JavaScript: 'javascript',
  TypeScript: 'typescript',
  Python: 'python',
  Java: 'java',
  'C++': 'cpp',
  Go: 'go',
  Rust: 'rust',
  PHP: 'php',
  Ruby: 'ruby',
  Swift: 'swift',
  Kotlin: 'kotlin',
  SQL: 'sql',
  'HTML/CSS': 'markup',
  Other: 'text',
}

const COMPLEXITY_OPTIONS = [
  { value: 'simple', label: 'Simple', desc: 'Basic implementation' },
  { value: 'moderate', label: 'Moderate', desc: 'Standard implementation' },
  { value: 'complex', label: 'Complex', desc: 'Advanced implementation' },
]

const CODE_MODELS = [
  { value: 'nvidia/llama-3.3-nemotron-super-49b-v1', label: 'Nemotron Super 49B' },
  { value: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', label: 'Nemotron Ultra 253B' },
  { value: 'qwen/qwen2.5-coder-32b-instruct', label: 'Qwen Coder 32B' },
  { value: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1' },
  { value: '@cf/deepseek-ai/deepseek-coder-6.7b-instruct', label: 'DeepSeek Coder 6.7B (Fast)' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function CodePage() {
  // Form state
  const [language, setLanguage] = useState('TypeScript')
  const [prompt, setPrompt] = useState('')
  const [context, setContext] = useState('')
  const [complexity, setComplexity] = useState('moderate')
  const [selectedModel, setSelectedModel] = useState('nvidia/llama-3.3-nemotron-super-49b-v1')

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [generatedExplanation, setGeneratedExplanation] = useState('')
  const [generatedLang, setGeneratedLang] = useState('')

  // History
  const [history, setHistory] = useState<CodeHistoryItem[]>([])

  // Copy state
  const [copied, setCopied] = useState(false)

  // ─── Handle generate ────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Missing Prompt', description: 'Please describe what code you want to generate', variant: 'destructive' })
      return
    }

    setGenerating(true)
    setGeneratedCode('')
    setGeneratedExplanation('')
    setGeneratedLang('')

    try {
      const fullPrompt = context.trim()
        ? `${prompt}\n\nAdditional context: ${context}\nComplexity: ${complexity}`
        : `${prompt}\nComplexity: ${complexity}`

      const res = await fetch('/api/generate/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          language,
          model: selectedModel,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Code generation failed')
      }

      const data = await res.json()
      setGeneratedCode(data.code || '')
      setGeneratedExplanation(data.explanation || '')
      setGeneratedLang(data.language || language)

      // Add to history
      const historyItem: CodeHistoryItem = {
        id: Date.now().toString(),
        prompt: prompt.trim(),
        language: data.language || language,
        code: data.code || '',
        explanation: data.explanation || '',
        timestamp: Date.now(),
      }
      setHistory((prev) => [historyItem, ...prev].slice(0, 20))

      toast({ title: 'Code Generated!', description: `${language} code generated successfully` })
    } catch (err) {
      toast({
        title: 'Generation Failed',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  // ─── Handle copy ───────────────────────────────────────────────────────

  const handleCopy = useCallback(() => {
    if (!generatedCode) return
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    toast({ title: 'Copied!', description: 'Code copied to clipboard' })
    setTimeout(() => setCopied(false), 2000)
  }, [generatedCode])

  // ─── Load from history ─────────────────────────────────────────────────

  const loadFromHistory = (item: CodeHistoryItem) => {
    setGeneratedCode(item.code)
    setGeneratedExplanation(item.explanation)
    setGeneratedLang(item.language)
    setPrompt(item.prompt)
    setLanguage(item.language)
  }

  // ─── Clear history ─────────────────────────────────────────────────────

  const clearHistory = () => {
    setHistory([])
    toast({ title: 'History Cleared' })
  }

  // ─── Get syntax language ───────────────────────────────────────────────

  const getSyntaxLang = (lang: string): string => {
    return langToSyntax[lang] || 'text'
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
      {/* ─── Left: Input Form ──────────────────────────────────────────── */}
      <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 flex flex-col gap-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Code2 className="h-5 w-5 text-emerald-600" />
              Code Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Language */}
            <div className="space-y-1.5">
              <Label className="text-sm">Programming Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div className="space-y-1.5">
              <Label className="text-sm">Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CODE_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prompt */}
            <div className="space-y-1.5">
              <Label className="text-sm">
                Description <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                placeholder="Describe what code you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Additional context */}
            <div className="space-y-1.5">
              <Label className="text-sm">
                Additional Context <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                placeholder="Any specific requirements, libraries, or frameworks?"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Complexity */}
            <div className="space-y-2">
              <Label className="text-sm">Complexity</Label>
              <div className="grid grid-cols-3 gap-2">
                {COMPLEXITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setComplexity(opt.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                      complexity === opt.value
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-background text-foreground border-border hover:border-emerald-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Code
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ─── History ─────────────────────────────────────────────────── */}
        {history.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Recent Generations
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={clearHistory} className="h-7 px-2 text-xs text-muted-foreground">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[240px]">
                <div className="space-y-1 px-4 pb-3">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-muted/60 transition-colors group"
                    >
                      <div className="flex items-start gap-2">
                        <FileCode2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{item.prompt}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {item.language}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Right: Code Output ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {!generatedCode && !generating ? (
            /* ─── Empty State ──────────────────────────────────────────── */
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full min-h-[500px] text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
                <Code2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Code Generator</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Describe the code you need, select a programming language, and let AI generate it for you with syntax highlighting and explanations.
              </p>
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <Play className="h-3 w-3" />
                <span>Fill in the form and click Generate</span>
              </div>
            </motion.div>
          ) : (
            /* ─── Code Result ──────────────────────────────────────────── */
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 h-full flex flex-col"
            >
              {/* Code block header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-xs">
                    {generatedLang || language}
                  </Badge>
                  {generatedCode && (
                    <span className="text-xs text-muted-foreground">
                      {generatedCode.split('\n').length} lines
                    </span>
                  )}
                </div>
                {generatedCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Code block */}
              <Card className="flex-1 min-h-0 overflow-hidden border-0">
                <div className="bg-[#282c34] rounded-lg overflow-hidden h-full">
                  {generating ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                      <p className="text-sm text-gray-400">Generating code...</p>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  ) : generatedCode ? (
                    <ScrollArea className="max-h-[calc(100vh-340px)]">
                      <SyntaxHighlighter
                        language={getSyntaxLang(generatedLang || language)}
                        style={oneDark}
                        customStyle={{
                          margin: 0,
                          padding: '1rem',
                          fontSize: '0.8125rem',
                          lineHeight: '1.6',
                          background: 'transparent',
                        }}
                        showLineNumbers
                        lineNumberStyle={{
                          minWidth: '2.5em',
                          paddingRight: '1em',
                          color: '#636d83',
                          userSelect: 'none',
                        }}
                      >
                        {generatedCode}
                      </SyntaxHighlighter>
                    </ScrollArea>
                  ) : null}
                </div>
              </Card>

              {/* Explanation */}
              {generatedExplanation && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      Explanation
                    </h4>
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {generatedExplanation}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
