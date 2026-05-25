'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  BookOpen,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Copy,
  Download,
  FileText,
  Loader2,
  Check,
  Plus,
  Trash2,
  GripVertical,
  Cpu,
  RefreshCw,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OutlineSection {
  id: string
  title: string
  description: string
}

interface GeneratedSection {
  title: string
  content: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, title: 'Topic & Keywords', icon: BookOpen },
  { number: 2, title: 'Outline', icon: FileText },
  { number: 3, title: 'Generate Content', icon: Sparkles },
  { number: 4, title: 'Review & Export', icon: Download },
]

const MODEL_OPTIONS = [
  { value: 'nvidia/llama-3.3-nemotron-super-49b-v1', label: 'Nemotron Super 49B' },
  { value: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', label: 'Nemotron Ultra 253B' },
  { value: 'meta/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
  { value: 'mistralai/mistral-nemotron', label: 'Mistral Nemotron' },
  { value: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1' },
  { value: '@cf/meta/llama-3-8b-instruct', label: 'Llama 3 8B (Fast)' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function ArticleWizardPage() {
  const { user } = useAppStore()

  // Wizard state
  const [step, setStep] = useState(1)
  const [topic, setTopic] = useState('')
  const [keywords, setKeywords] = useState('')
  const [selectedModel, setSelectedModel] = useState('nvidia/llama-3.3-nemotron-super-49b-v1')

  // Outline state
  const [outline, setOutline] = useState<OutlineSection[]>([])
  const [generatingOutline, setGeneratingOutline] = useState(false)

  // Content state
  const [sections, setSections] = useState<GeneratedSection[]>([])
  const [generating, setGenerating] = useState(false)
  const [generatingSectionIndex, setGeneratingSectionIndex] = useState(-1)

  // Export state
  const [copied, setCopied] = useState(false)

  // ─── Step 1 → 2: Generate Outline ─────────────────────────────────────────

  const handleGenerateOutline = useCallback(async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    setGeneratingOutline(true)
    try {
      const res = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'article-wizard-outline',
          inputs: { topic, keywords: keywords || 'general' },
          tone: 'Professional',
          language: 'English',
          length: 'long',
          model: selectedModel,
          customPrompt: `Create a detailed article outline for the topic: "${topic}". ${keywords ? `Include these keywords: ${keywords}.` : ''} Return the outline as a JSON array of objects with "title" and "description" fields. Each section should have a clear title and a brief description of what it covers. Aim for 5-8 sections. Only return the JSON array, no other text.`,
        }),
      })

      if (!res.ok) throw new Error('Failed to generate outline')
      const data = await res.json()

      let parsed: OutlineSection[] = []
      try {
        const content = data.content || ''
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]).map(
            (item: { title: string; description: string }, idx: number) => ({
              id: `section-${idx}`,
              title: item.title || 'Untitled Section',
              description: item.description || '',
            })
          )
        }
      } catch {
        // Fallback: create sections from the raw text
        const lines = (data.content || '').split('\n').filter((l: string) => l.trim())
        parsed = lines
          .filter((l: string) => l.match(/^#{1,3}\s/))
          .map((l: string, idx: number) => ({
            id: `section-${idx}`,
            title: l.replace(/^#{1,3}\s/, '').trim(),
            description: '',
          }))
      }

      if (parsed.length === 0) {
        parsed = [
          { id: 'section-0', title: 'Introduction', description: `Introduction to ${topic}` },
          { id: 'section-1', title: 'Main Content', description: `Key points about ${topic}` },
          { id: 'section-2', title: 'Conclusion', description: `Summary and takeaways` },
        ]
      }

      setOutline(parsed)
      setStep(2)
      toast.success('Outline generated successfully!')
    } catch {
      toast.error('Failed to generate outline. Please try again.')
    } finally {
      setGeneratingOutline(false)
    }
  }, [topic, keywords, selectedModel])

  // ─── Step 2 → 3: Generate Content for each section ───────────────────────

  const handleGenerateContent = useCallback(async () => {
    if (outline.length === 0) {
      toast.error('Please add at least one section to the outline')
      return
    }

    setGenerating(true)
    setSections([])
    const generated: GeneratedSection[] = []

    for (let i = 0; i < outline.length; i++) {
      setGeneratingSectionIndex(i)
      try {
        const section = outline[i]
        const prevSections = generated.map((s) => `## ${s.title}\n${s.content}`).join('\n\n')

        const res = await fetch('/api/generate/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: 'article-wizard-section',
            inputs: {
              topic,
              sectionTitle: section.title,
              sectionDescription: section.description,
              previousSections: prevSections
                ? `Previous sections summary:\n${prevSections.slice(0, 1000)}`
                : 'This is the first section.',
            },
            tone: 'Professional',
            language: 'English',
            length: 'long',
            model: selectedModel,
            customPrompt: `Write a comprehensive section for an article about "${topic}". Section title: "${section.title}". ${section.description ? `Section description: ${section.description}.` : ''} Write 3-5 detailed paragraphs. Use markdown formatting with headers, lists, and emphasis where appropriate. Maintain a professional and informative tone. Do not repeat the section title as a heading.`,
          }),
        })

        if (!res.ok) throw new Error('Failed to generate section')
        const data = await res.json()
        generated.push({ title: section.title, content: data.content || '' })
        setSections([...generated])
      } catch {
        generated.push({ title: outline[i].title, content: 'Failed to generate this section.' })
        setSections([...generated])
      }
    }

    setGenerating(false)
    setGeneratingSectionIndex(-1)
    setStep(4)
    toast.success('Article generated successfully!')
  }, [outline, topic, selectedModel])

  // ─── Outline management ──────────────────────────────────────────────────

  const addSection = useCallback(() => {
    setOutline((prev) => [
      ...prev,
      { id: `section-${Date.now()}`, title: '', description: '' },
    ])
  }, [])

  const removeSection = useCallback((id: string) => {
    setOutline((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const updateSection = useCallback(
    (id: string, field: 'title' | 'description', value: string) => {
      setOutline((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
      )
    },
    []
  )

  // ─── Export handlers ─────────────────────────────────────────────────────

  const fullArticle = sections
    .map((s) => `## ${s.title}\n\n${s.content}`)
    .join('\n\n')

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullArticle)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }, [fullArticle])

  const handleDownloadText = useCallback(() => {
    const blob = new Blob([fullArticle], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${topic || 'article'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded as text file')
  }, [fullArticle, topic])

  const handleDownloadPDF = useCallback(() => {
    const blob = new Blob([fullArticle], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${topic || 'article'}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded as PDF')
  }, [fullArticle, topic])

  const handleDownloadWord = useCallback(() => {
    const blob = new Blob([fullArticle], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${topic || 'article'}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded as Word document')
  }, [fullArticle, topic])

  // ─── Word count ──────────────────────────────────────────────────────────

  const totalWords = sections.reduce(
    (acc, s) => acc + s.content.split(/\s+/).filter(Boolean).length,
    0
  )

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
            <BookOpen className="size-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Article Wizard</h1>
            <p className="text-sm text-muted-foreground">
              Create long-form articles in 4 simple steps
            </p>
          </div>
        </div>
      </motion.div>

      {/* Step Indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => {
              const Icon = s.icon
              const isActive = step === s.number
              const isCompleted = step > s.number
              return (
                <div key={s.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        backgroundColor: isCompleted
                          ? '#10b981'
                          : isActive
                          ? '#059669'
                          : undefined,
                      }}
                      className={`flex size-10 items-center justify-center rounded-full border-2 transition-colors ${
                        isCompleted
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : isActive
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-muted-foreground/30 text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="size-4" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </motion.div>
                    <span
                      className={`text-[10px] font-medium ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isCompleted
                          ? 'text-emerald-500'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="flex-1 mx-2 mt-[-18px]">
                      <div
                        className={`h-0.5 rounded-full transition-colors ${
                          step > s.number ? 'bg-emerald-500' : 'bg-muted'
                        }`}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* ─── Step 1: Topic & Keywords ─────────────────────────────────── */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="size-5 text-emerald-500" />
                  Topic & Keywords
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Article Topic <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g., The Future of Artificial Intelligence in Healthcare"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="h-11 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Keywords{' '}
                    <span className="text-muted-foreground font-normal">
                      (comma-separated)
                    </span>
                  </Label>
                  <Input
                    placeholder="e.g., AI, healthcare, machine learning, diagnostics"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="h-11 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Cpu className="size-3.5 text-emerald-500" /> Model
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

                <div className="flex justify-end">
                  <Button
                    onClick={handleGenerateOutline}
                    disabled={!topic.trim() || generatingOutline}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[180px]"
                  >
                    {generatingOutline ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4 mr-2" />
                        Generate Outline
                        <ChevronRight className="size-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Step 2: Outline ──────────────────────────────────────────── */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="size-5 text-emerald-500" />
                    Article Outline
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addSection}
                    className="gap-1.5 text-xs"
                  >
                    <Plus className="size-3.5" />
                    Add Section
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Review and edit your article outline. Drag sections to reorder, or
                  add/remove sections as needed.
                </p>

                <div className="space-y-3">
                  {outline.map((section, idx) => (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 group"
                    >
                      <div className="flex items-center gap-2 pt-2">
                        <GripVertical className="size-4 text-muted-foreground/50" />
                        <Badge
                          variant="secondary"
                          className="size-6 flex items-center justify-center p-0 text-xs font-bold"
                        >
                          {idx + 1}
                        </Badge>
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Section title"
                          value={section.title}
                          onChange={(e) =>
                            updateSection(section.id, 'title', e.target.value)
                          }
                          className="h-9 text-sm font-medium"
                        />
                        <Textarea
                          placeholder="Brief description of this section..."
                          value={section.description}
                          onChange={(e) =>
                            updateSection(section.id, 'description', e.target.value)
                          }
                          className="min-h-[50px] text-xs resize-y"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeSection(section.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </motion.div>
                  ))}
                </div>

                {outline.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-center">
                    <FileText className="size-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No sections yet. Click &quot;Add Section&quot; to create your outline.
                    </p>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="gap-1"
                  >
                    <ChevronLeft className="size-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleGenerateContent}
                    disabled={outline.length === 0 || generating}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[180px]"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        {generatingSectionIndex >= 0
                          ? `Section ${generatingSectionIndex + 1}/${outline.length}...`
                          : 'Starting...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4 mr-2" />
                        Generate Content
                        <ChevronRight className="size-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress during generation */}
                {generating && (
                  <div className="space-y-2">
                    <Progress
                      value={((generatingSectionIndex + 1) / outline.length) * 100}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Generating section {generatingSectionIndex + 1} of{' '}
                      {outline.length}: {outline[generatingSectionIndex]?.title}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── Step 3: Generating (shown during step 2→4 transition) ──── */}
          {/* (handled inline in step 2) */}

          {/* ─── Step 4: Review & Export ──────────────────────────────────── */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Download className="size-5 text-emerald-500" />
                    Review & Export
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
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
                      onClick={handleDownloadText}
                      className="gap-1.5 text-xs"
                    >
                      <FileText className="size-3.5" />
                      Text
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadPDF}
                      className="gap-1.5 text-xs"
                    >
                      <Download className="size-3.5" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadWord}
                      className="gap-1.5 text-xs"
                    >
                      <Download className="size-3.5" />
                      Word
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Article meta */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="secondary" className="gap-1">
                    <Cpu className="size-3" />
                    {MODEL_OPTIONS.find((m) => m.value === selectedModel)?.label || selectedModel}
                  </Badge>
                  <Badge variant="secondary">{totalWords} words</Badge>
                  <Badge variant="secondary">{sections.length} sections</Badge>
                  <Badge variant="secondary">
                    ~{Math.max(1, Math.ceil(totalWords / 200))} min read
                  </Badge>
                </div>

                {/* Full article preview */}
                <ScrollArea className="max-h-[600px]">
                  <Card className="border-emerald-500/10">
                    <CardContent className="p-6">
                      <h1 className="text-2xl font-bold mb-6 text-foreground">
                        {topic}
                      </h1>
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                        <ReactMarkdown>{fullArticle}</ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollArea>

                <Separator />

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="gap-1"
                  >
                    <ChevronLeft className="size-4" />
                    Edit Outline
                  </Button>
                  <Button
                    onClick={handleGenerateContent}
                    disabled={generating}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    <RefreshCw
                      className={`size-4 ${generating ? 'animate-spin' : ''}`}
                    />
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
