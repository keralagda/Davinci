'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  Search,
  BookOpen,
  Sparkles,
  Heart,
  Copy,
  Download,
  FileText,
  FileDown,
  RefreshCw,
  Star,
  X,
  Loader2,
  ChevronDown,
  Languages,
  Type,
  Ruler,
  Cpu,
  Check,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TemplateField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number'
  placeholder?: string
  required?: boolean
}

interface TemplateCategory {
  id: string
  name: string
  slug: string
  icon?: string | null
  description?: string | null
}

interface Template {
  id: string
  name: string
  slug: string
  description: string
  icon?: string | null
  prompt: string
  fields: string // JSON string
  toneOptions?: string | null
  languageOptions?: string | null
  isPremium: boolean
  isFeatured: boolean
  category: TemplateCategory
}

// ─── Icon Mapping ─────────────────────────────────────────────────────────────

const iconMap: Record<string, string> = {
  FileText: '📄',
  Heading: '📝',
  Lightbulb: '💡',
  PenLine: '✍️',
  Megaphone: '📣',
  Target: '🎯',
  Bullhorn: '📢',
  Share2: '🔗',
  Instagram: '📸',
  Twitter: '🐦',
  MessageCircle: '💬',
  Mail: '✉️',
  Globe: '🌐',
  Search: '🔍',
  ShoppingCart: '🛒',
  Sparkles: '✨',
  BookOpen: '📖',
  Music: '🎵',
  Briefcase: '💼',
  Code2: '💻',
  GraduationCap: '🎓',
  Video: '🎥',
  Wrench: '🔧',
  Heart: '❤️',
  Star: '⭐',
  Palette: '🎨',
  Zap: '⚡',
  Feather: '🪶',
  Rocket: '🚀',
  Newspaper: '📰',
  Award: '🏆',
  Users: '👥',
  TrendingUp: '📈',
  BarChart: '📊',
  PieChart: '🥧',
  Presentation: '🎤',
  Layout: '📐',
  PenTool: '🖊️',
  Edit: '✏️',
  File: '📃',
  Document: '📋',
}

function getEmoji(iconName?: string | null): string {
  if (!iconName) return '📝'
  return iconMap[iconName] || '📝'
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_TONES = [
  'Professional',
  'Casual',
  'Formal',
  'Friendly',
  'Persuasive',
  'Creative',
  'Academic',
  'Humorous',
]

const DEFAULT_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Dutch',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Russian',
]

const LENGTH_OPTIONS = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
] as const

const MODEL_OPTIONS = [
  { value: 'nvidia/llama-3.3-nemotron-super-49b-v1', label: 'Nemotron Super 49B' },
  { value: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', label: 'Nemotron Ultra 253B' },
  { value: 'meta/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
  { value: 'mistralai/mistral-nemotron', label: 'Mistral Nemotron' },
  { value: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1' },
  { value: '@cf/meta/llama-3-8b-instruct', label: 'Llama 3 8B (Fast)' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function WriterPage() {
  // Store
  const {
    selectedTemplateId,
    setSelectedTemplateId,
    selectedCategoryId,
    setSelectedCategoryId,
  } = useAppStore()

  // Data state
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())

  // Generation state
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [selectedTone, setSelectedTone] = useState('Professional')
  const [selectedLanguage, setSelectedLanguage] = useState('English')
  const [selectedLength, setSelectedLength] = useState<string>('medium')
  const [selectedModel, setSelectedModel] = useState('nvidia/llama-3.3-nemotron-super-49b-v1')
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [copied, setCopied] = useState(false)

  // ─── Fetch templates ─────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchTemplates() {
      try {
        setLoading(true)
        const res = await fetch('/api/templates')
        if (!res.ok) throw new Error('Failed to fetch templates')
        const data = await res.json()
        setTemplates(data.templates || [])

        // Extract unique categories
        const cats = Array.from(
          new Map(
            (data.templates || []).map((t: Template) => [t.category.id, t.category])
          ).values()
        ) as TemplateCategory[]
        cats.sort((a, b) => (a.name > b.name ? 1 : -1))
        setCategories(cats)
      } catch {
        toast.error('Failed to load templates')
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  // ─── Sync selected template from store ───────────────────────────────────

  useEffect(() => {
    if (selectedTemplateId && templates.length > 0) {
      const tmpl = templates.find((t) => t.id === selectedTemplateId)
      if (tmpl) {
        setSelectedTemplate(tmpl)
        setFormValues({})
        setGeneratedContent('')
        setWordCount(0)
      }
    }
  }, [selectedTemplateId, templates])

  // ─── Filtered templates ──────────────────────────────────────────────────

  const filteredTemplates = useMemo(() => {
    let result = templates

    // Category filter
    if (selectedCategoryId) {
      result = result.filter((t) => t.category.id === selectedCategoryId)
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      )
    }

    // Favorites filter
    if (showFavorites) {
      result = result.filter((t) => favoriteIds.has(t.id))
    }

    return result
  }, [templates, selectedCategoryId, searchQuery, showFavorites, favoriteIds])

  // ─── Parse template fields ───────────────────────────────────────────────

  const parsedFields = useMemo((): TemplateField[] => {
    if (!selectedTemplate?.fields) return []
    try {
      const fields = JSON.parse(selectedTemplate.fields)
      return Array.isArray(fields) ? fields : []
    } catch {
      return []
    }
  }, [selectedTemplate])

  // ─── Parse tone/language options from template ──────────────────────────

  const toneOptions = useMemo(() => {
    if (!selectedTemplate?.toneOptions) return DEFAULT_TONES
    try {
      const opts = JSON.parse(selectedTemplate.toneOptions)
      return Array.isArray(opts) && opts.length > 0 ? opts : DEFAULT_TONES
    } catch {
      return DEFAULT_TONES
    }
  }, [selectedTemplate])

  const languageOptions = useMemo(() => {
    if (!selectedTemplate?.languageOptions) return DEFAULT_LANGUAGES
    try {
      const opts = JSON.parse(selectedTemplate.languageOptions)
      return Array.isArray(opts) && opts.length > 0 ? opts : DEFAULT_LANGUAGES
    } catch {
      return DEFAULT_LANGUAGES
    }
  }, [selectedTemplate])

  // ─── Check required fields ───────────────────────────────────────────────

  const requiredFieldsFilled = useMemo(() => {
    const required = parsedFields.filter((f) => f.required)
    return required.every((f) => formValues[f.name]?.trim())
  }, [parsedFields, formValues])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSelectTemplate = useCallback(
    (template: Template) => {
      setSelectedTemplate(template)
      setSelectedTemplateId(template.id)
      setFormValues({})
      setGeneratedContent('')
      setWordCount(0)
      setSelectedTone('Professional')
      setSelectedLanguage('English')
      setSelectedLength('medium')
    },
    [setSelectedTemplateId]
  )

  const handleFormChange = useCallback((name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!selectedTemplate || !requiredFieldsFilled) return

    setGenerating(true)
    setGeneratedContent('')
    setWordCount(0)

    try {
      const res = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          inputs: formValues,
          tone: selectedTone,
          language: selectedLanguage,
          length: selectedLength,
          model: selectedModel,
        }),
      })

      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      setGeneratedContent(data.content || '')
      setWordCount(data.wordsCount || data.content?.split(/\s+/).filter(Boolean).length || 0)
      toast.success('Content generated successfully!')
    } catch {
      toast.error('Failed to generate content. Please try again.')
    } finally {
      setGenerating(false)
    }
  }, [selectedTemplate, formValues, selectedTone, selectedLanguage, selectedLength, selectedModel, requiredFieldsFilled])

  const handleCopy = useCallback(async () => {
    if (!generatedContent) return
    try {
      await navigator.clipboard.writeText(generatedContent)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }, [generatedContent])

  const handleDownloadText = useCallback(() => {
    if (!generatedContent) return
    const blob = new Blob([generatedContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTemplate?.name || 'generated'}-content.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded as text file')
  }, [generatedContent, selectedTemplate])

  const handleDownloadPDF = useCallback(() => {
    if (!generatedContent) return
    const blob = new Blob([generatedContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTemplate?.name || 'generated'}-content.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded as PDF')
  }, [generatedContent, selectedTemplate])

  const handleDownloadWord = useCallback(() => {
    if (!generatedContent) return
    const blob = new Blob([generatedContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTemplate?.name || 'generated'}-content.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded as Word document')
  }, [generatedContent, selectedTemplate])

  const handleToggleFavorite = useCallback((templateId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (next.has(templateId)) {
        next.delete(templateId)
      } else {
        next.add(templateId)
      }
      return next
    })
  }, [])

  const handleToggleResultFavorite = useCallback(() => {
    if (!selectedTemplate) return
    handleToggleFavorite(selectedTemplate.id)
  }, [selectedTemplate, handleToggleFavorite])

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">
      {/* ─── Left Panel: Template Browser ───────────────────────────────── */}
      <div className="w-full lg:w-[40%] xl:w-[38%] flex flex-col min-h-0 border rounded-xl bg-card">
        {/* Search Bar */}
        <div className="p-4 pb-2 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                !selectedCategoryId
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategoryId === cat.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {getEmoji(cat.icon)} {cat.name}
              </button>
            ))}
          </div>

          {/* Favorites Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={showFavorites ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFavorites(!showFavorites)}
              className={`h-7 text-xs gap-1.5 ${
                showFavorites
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : ''
              }`}
            >
              <Heart className={`size-3 ${showFavorites ? 'fill-current' : ''}`} />
              Favorites
            </Button>
            <span className="text-xs text-muted-foreground">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Template Grid */}
        <ScrollArea className="flex-1 min-h-0 px-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-2.5 pb-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="size-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {showFavorites
                  ? 'No favorite templates yet'
                  : 'No templates found'}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {showFavorites
                  ? 'Click the heart icon on templates to add favorites'
                  : 'Try adjusting your search or category filter'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 pb-4">
              {filteredTemplates.map((template) => {
                const isSelected = selectedTemplate?.id === template.id
                const isFav = favoriteIds.has(template.id)

                return (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all relative group py-0 gap-0 overflow-hidden ${
                        isSelected
                          ? 'ring-2 ring-emerald-500 bg-emerald-500/5 border-emerald-500/30'
                          : 'hover:border-emerald-500/30 hover:bg-emerald-500/[0.02]'
                      }`}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardContent className="p-3 space-y-1.5">
                        <div className="flex items-start justify-between">
                          <span className="text-lg leading-none">
                            {getEmoji(template.icon)}
                          </span>
                          <div className="flex items-center gap-1">
                            {template.isPremium && (
                              <Badge className="h-4 px-1 text-[9px] font-bold bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">
                                PRO
                              </Badge>
                            )}
                            {template.isFeatured && !template.isPremium && (
                              <Badge className="h-4 px-1 text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                                <Star className="size-2.5 fill-current" />
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs font-semibold leading-tight line-clamp-1">
                          {template.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                          {template.description}
                        </p>
                      </CardContent>

                      {/* Favorite button overlay */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleFavorite(template.id)
                        }}
                        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-secondary"
                      >
                        <Heart
                          className={`size-3 ${
                            isFav
                              ? 'fill-rose-500 text-rose-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ─── Right Panel: Generation Workspace ──────────────────────────── */}
      <div className="w-full lg:w-[60%] xl:w-[62%] flex flex-col min-h-0 border rounded-xl bg-card">
        <ScrollArea className="flex-1 min-h-0">
          {!selectedTemplate ? (
            /* ─── Empty State ─────────────────────────────────────────── */
            <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <BookOpen className="size-10 text-emerald-500/60" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Select a template to get started
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Choose a template from the left panel to begin generating
                  AI-powered content. Each template comes with custom fields
                  and options tailored for specific content types.
                </p>
              </motion.div>
            </div>
          ) : (
            /* ─── Template Workspace ──────────────────────────────────── */
            <div className="p-5 space-y-5">
              {/* Template Header */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{getEmoji(selectedTemplate.icon)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold truncate">
                        {selectedTemplate.name}
                      </h3>
                      {selectedTemplate.isPremium && (
                        <Badge className="h-5 px-1.5 text-[10px] font-bold bg-amber-500/10 text-amber-600 border-amber-500/20">
                          PRO
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {selectedTemplate.description}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {selectedTemplate.category.name}
                  </Badge>
                </div>
              </motion.div>

              <Separator />

              {/* Dynamic Form Fields */}
              {parsedFields.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <Type className="size-3.5 text-emerald-500" />
                    Template Fields
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parsedFields.map((field) => (
                      <div
                        key={field.name}
                        className={
                          field.type === 'textarea' ? 'md:col-span-2' : ''
                        }
                      >
                        <Label className="text-xs mb-1.5 block">
                          {field.label}
                          {field.required && (
                            <span className="text-red-500 ml-0.5">*</span>
                          )}
                        </Label>
                        {field.type === 'textarea' ? (
                          <Textarea
                            placeholder={field.placeholder}
                            value={formValues[field.name] || ''}
                            onChange={(e) =>
                              handleFormChange(field.name, e.target.value)
                            }
                            className="min-h-[80px] resize-y text-sm"
                          />
                        ) : field.type === 'select' ? (
                          <Select
                            value={formValues[field.name] || ''}
                            onValueChange={(val) =>
                              handleFormChange(field.name, val)
                            }
                          >
                            <SelectTrigger className="w-full text-sm">
                              <SelectValue
                                placeholder={field.placeholder || 'Select...'}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {field.placeholder
                                ?.split(',')
                                .map((opt) => opt.trim())
                                .filter(Boolean)
                                .map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === 'number' ? (
                          <Input
                            type="number"
                            placeholder={field.placeholder}
                            value={formValues[field.name] || ''}
                            onChange={(e) =>
                              handleFormChange(field.name, e.target.value)
                            }
                            className="text-sm"
                          />
                        ) : (
                          <Input
                            type="text"
                            placeholder={field.placeholder}
                            value={formValues[field.name] || ''}
                            onChange={(e) =>
                              handleFormChange(field.name, e.target.value)
                            }
                            className="text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Generation Options */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Cpu className="size-3.5 text-emerald-500" />
                  Generation Options
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tone Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      <Languages className="size-3" /> Tone
                    </Label>
                    <Select
                      value={selectedTone}
                      onValueChange={setSelectedTone}
                    >
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        {toneOptions.map((tone) => (
                          <SelectItem key={tone} value={tone}>
                            {tone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Language Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      <Languages className="size-3" /> Language
                    </Label>
                    <Select
                      value={selectedLanguage}
                      onValueChange={setSelectedLanguage}
                    >
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Output Length */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Ruler className="size-3" /> Output Length
                  </Label>
                  <div className="flex gap-2">
                    {LENGTH_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedLength(opt.value)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                          selectedLength === opt.value
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-secondary text-muted-foreground border-border hover:border-emerald-500/30'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Cpu className="size-3" /> Model
                  </Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Select model" />
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
              </div>

              <Separator />

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!requiredFieldsFilled || generating}
                className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>

              {!requiredFieldsFilled && parsedFields.some((f) => f.required) && (
                <p className="text-xs text-center text-muted-foreground">
                  Please fill in all required fields to generate content
                </p>
              )}

              {/* ─── Result Area ──────────────────────────────────────────── */}
              <AnimatePresence>
                {(generating || generatedContent) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    <Separator />

                    {/* Result Toolbar */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopy}
                          disabled={!generatedContent}
                          className="h-7 text-xs gap-1"
                        >
                          {copied ? (
                            <>
                              <Check className="size-3" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadText}
                          disabled={!generatedContent}
                          className="h-7 text-xs gap-1"
                        >
                          <FileText className="size-3" />
                          Text
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadPDF}
                          disabled={!generatedContent}
                          className="h-7 text-xs gap-1"
                        >
                          <FileDown className="size-3" />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadWord}
                          disabled={!generatedContent}
                          className="h-7 text-xs gap-1"
                        >
                          <Download className="size-3" />
                          Word
                        </Button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToggleResultFavorite}
                          className="h-7 text-xs gap-1"
                        >
                          <Heart
                            className={`size-3 ${
                              favoriteIds.has(selectedTemplate.id)
                                ? 'fill-rose-500 text-rose-500'
                                : ''
                            }`}
                          />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerate}
                          disabled={!requiredFieldsFilled || generating}
                          className="h-7 text-xs gap-1"
                        >
                          <RefreshCw
                            className={`size-3 ${generating ? 'animate-spin' : ''}`}
                          />
                          Regenerate
                        </Button>
                        {wordCount > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {wordCount} words
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Generated Content */}
                    {generating ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Loader2 className="size-8 text-emerald-500 animate-spin mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Generating your content...
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0ms]" />
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    ) : generatedContent ? (
                      <Card className="border-emerald-500/10">
                        <CardContent className="p-4">
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                            <ReactMarkdown>{generatedContent}</ReactMarkdown>
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
