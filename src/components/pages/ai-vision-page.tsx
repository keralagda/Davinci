'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  Eye,
  Sparkles,
  Upload,
  ImageIcon,
  Loader2,
  Copy,
  Check,
  Trash2,
  Clock,
  MessageSquare,
  X,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VisionAnalysis {
  id: string
  prompt: string
  analysis: string
  imageName: string
  timestamp: Date
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AiVisionPage() {
  const { user } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageBase64, setImageBase64] = useState<string>('')
  const [prompt, setPrompt] = useState('What do you see in this image?')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [copied, setCopied] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // History
  const [history, setHistory] = useState<VisionAnalysis[]>([])

  // ─── File handling ───────────────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, WebP, BMP)')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB')
      return
    }

    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImagePreview(result)
      // Extract base64 data
      const base64 = result.split(',')[1] || result
      setImageBase64(base64)
    }
    reader.readAsDataURL(file)
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

  const clearImage = useCallback(() => {
    setImageFile(null)
    setImagePreview('')
    setImageBase64('')
    setAnalysis('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // ─── Analyze image ──────────────────────────────────────────────────────

  const handleAnalyze = useCallback(async () => {
    if (!imageBase64) {
      toast.error('Please upload an image first')
      return
    }
    if (!prompt.trim()) {
      toast.error('Please enter a question about the image')
      return
    }

    setAnalyzing(true)
    setAnalysis('')

    try {
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          prompt: prompt,
          model: 'vlm',
        }),
      })

      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setAnalysis(data.analysis || 'No analysis returned')

      // Add to history
      const newEntry: VisionAnalysis = {
        id: `vision-${Date.now()}`,
        prompt,
        analysis: data.analysis || '',
        imageName: imageFile?.name || 'image',
        timestamp: new Date(),
      }
      setHistory((prev) => [newEntry, ...prev].slice(0, 20))

      toast.success('Image analyzed successfully!')
    } catch {
      toast.error('Failed to analyze image. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }, [imageBase64, prompt, imageFile])

  // ─── Copy handler ───────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(analysis)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }, [analysis])

  // ─── Format time ────────────────────────────────────────────────────────

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
            <Eye className="size-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Vision</h1>
            <p className="text-sm text-muted-foreground">
              Analyze images with AI-powered vision models
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-4 min-h-[500px]">
        {/* Left: Upload & Analyze */}
        <div className="w-full lg:w-3/5 space-y-4">
          {/* Upload Area */}
          <Card>
            <CardContent className="p-4 space-y-4">
              {!imagePreview ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    dragOver
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
                      : 'border-muted-foreground/25 hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/5'
                  }`}
                >
                  <Upload
                    className={`size-10 mb-3 ${
                      dragOver ? 'text-emerald-500' : 'text-muted-foreground/40'
                    }`}
                  />
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {dragOver ? 'Drop your image here' : 'Drag & drop your image here'}
                  </p>
                  <p className="text-xs text-muted-foreground/70">or click to browse</p>
                  <div className="flex items-center gap-2 mt-3">
                    {['JPEG', 'PNG', 'GIF', 'WebP'].map((fmt) => (
                      <Badge key={fmt} variant="secondary" className="text-[9px]">
                        {fmt}
                      </Badge>
                    ))}
                    <Badge variant="secondary" className="text-[9px]">
                      Max 10MB
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Image Preview */}
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Uploaded"
                      className="w-full max-h-[400px] object-contain rounded-lg border bg-muted/20"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={clearImage}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">
                      {imageFile?.name}
                    </span>
                    {imageFile && (
                      <Badge variant="secondary" className="text-[9px]">
                        {(imageFile.size / 1024).toFixed(0)} KB
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Question Input */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Label className="text-sm font-medium">Ask about the image</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What do you see in this image?"
                className="min-h-[80px] resize-y text-sm"
              />
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  'What do you see in this image?',
                  'Describe this image in detail',
                  'Extract any text from this image',
                  'What objects are in this image?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setPrompt(suggestion)}
                    className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-emerald-500/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors text-muted-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={!imageBase64 || !prompt.trim() || analyzing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 mr-2" />
                    Analyze Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Analysis Result */}
          <AnimatePresence>
            {analyzing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border-emerald-500/20">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <Loader2 className="size-8 text-emerald-500 animate-spin mb-3" />
                    <p className="text-sm text-muted-foreground">Analyzing your image...</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {analysis && !analyzing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border-emerald-500/10">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                        <Eye className="size-3.5 text-emerald-500" />
                        Analysis Result
                      </CardTitle>
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
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-muted-foreground prose-headings:text-foreground">
                      <ReactMarkdown>{analysis}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: History Sidebar */}
        <div className="w-full lg:w-2/5">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="size-3.5 text-emerald-500" />
                Analysis History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[600px]">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <MessageSquare className="size-8 text-muted-foreground/20 mb-2" />
                    <p className="text-sm text-muted-foreground">No analyses yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Upload an image and analyze it to see history
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 rounded-lg border hover:border-emerald-500/30 cursor-pointer transition-colors group"
                        onClick={() => {
                          setAnalysis(item.analysis)
                          setPrompt(item.prompt)
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <ImageIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium line-clamp-1">
                              {item.imageName}
                            </p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                              {item.prompt}
                            </p>
                            <p className="text-[10px] text-muted-foreground/70 mt-1">
                              {formatTime(item.timestamp)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              setHistory((prev) => prev.filter((h) => h.id !== item.id))
                            }}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
