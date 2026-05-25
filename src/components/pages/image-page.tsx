'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Download,
  Copy,
  Heart,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Square,
  RectangleVertical,
  RectangleHorizontal,
  Loader2,
  ZoomIn,
  X,
  Palette,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// Types
interface GeneratedImage {
  id: string
  imageUrl: string
  prompt: string
  size: string
  quality: string
  style?: string
  status: string
  createdAt: string
}

interface ImageResponse {
  id: string
  imageUrl: string
  prompt: string
  size: string
  quality: string
  status: string
}

// Image model options
const IMAGE_MODELS = [
  { value: '@cf/black-forest-labs/flux-1-schnell', label: 'FLUX.1 Schnell (Cloudflare)' },
  { value: 'stabilityai/stable-diffusion-xl', label: 'Stable Diffusion XL (NVIDIA)' },
  { value: '@cf/stabilityai/stable-diffusion-xl-base-1.0', label: 'SDXL Base (Cloudflare)' },
]

// Size options
const SIZE_OPTIONS = [
  { value: '1024x1024', label: 'Square', sublabel: '1024×1024', icon: Square },
  { value: '768x1024', label: 'Portrait', sublabel: '768×1024', icon: RectangleVertical },
  { value: '1024x768', label: 'Landscape', sublabel: '1024×768', icon: RectangleHorizontal },
] as const

// Number of images options
const NUM_IMAGES_OPTIONS = [1, 2, 3, 4] as const

export function ImagePage() {
  // Form state
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [showNegativePrompt, setShowNegativePrompt] = useState(false)
  const [size, setSize] = useState('1024x1024')
  const [quality, setQuality] = useState('standard')
  const [style, setStyle] = useState('vivid')
  const [numImages, setNumImages] = useState<1 | 2 | 3 | 4>(1)
  const [imageModel, setImageModel] = useState('@cf/black-forest-labs/flux-1-schnell')

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<ImageResponse | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)

  // Gallery state
  const [gallery, setGallery] = useState<GeneratedImage[]>([])
  const [galleryLoading, setGalleryLoading] = useState(false)

  // Preview dialog
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null)

  // Fetch gallery images
  const fetchGallery = useCallback(async () => {
    setGalleryLoading(true)
    try {
      const res = await fetch('/api/images')
      if (res.ok) {
        const data = await res.json()
        setGallery(data.images ?? [])
      }
    } catch {
      // silently fail
    } finally {
      setGalleryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGallery()
  }, [fetchGallery])

  // Generate image
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }
    if (isGenerating) return

    setIsGenerating(true)
    setGeneratedImage(null)
    setIsFavorited(false)

    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negativePrompt: negativePrompt.trim() || undefined,
          size,
          quality,
          style,
          model: imageModel,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error ?? 'Failed to generate image')
      }

      const data: ImageResponse = await res.json()
      setGeneratedImage(data)
      toast.success('Image generated successfully!')
      fetchGallery()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, negativePrompt, size, quality, style, imageModel, isGenerating, fetchGallery])

  // Download image
  const handleDownload = useCallback(async (imageUrl: string, imageId: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-image-${imageId}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Image downloaded')
    } catch {
      toast.error('Failed to download image')
    }
  }, [])

  // Copy prompt
  const handleCopyPrompt = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Prompt copied to clipboard')
    } catch {
      toast.error('Failed to copy prompt')
    }
  }, [])

  // Favorite toggle
  const handleFavorite = useCallback(() => {
    setIsFavorited((prev) => !prev)
    toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites')
  }, [isFavorited])

  const currentSizeOption = SIZE_OPTIONS.find((s) => s.value === size)

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <Palette className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Image Generator</h1>
            <p className="text-sm text-muted-foreground">
              Create stunning images from text descriptions
            </p>
          </div>
        </div>

        {/* Main content: form + result */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel - Generation Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border bg-card p-5 space-y-5">
              {/* Prompt */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Prompt</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to create..."
                  className="min-h-[120px] resize-none focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                />
              </div>

              {/* Negative Prompt (collapsible) */}
              <Collapsible open={showNegativePrompt} onOpenChange={setShowNegativePrompt}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-muted-foreground hover:text-foreground"
                  >
                    <span className="text-xs">Negative prompt (optional)</span>
                    {showNegativePrompt ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Textarea
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="What to exclude from the image..."
                    className="min-h-[80px] resize-none mt-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Image Size */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Image Size</Label>
                <div className="grid grid-cols-3 gap-2">
                  {SIZE_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setSize(opt.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors ${
                          size === opt.value
                            ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                            : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700 text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{opt.label}</span>
                        <span className="text-[10px] opacity-70">{opt.sublabel}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Image Model */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Model</Label>
                <Select value={imageModel} onValueChange={setImageModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quality & Style row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quality</Label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="hd">HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vivid">Vivid</SelectItem>
                      <SelectItem value="natural">Natural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Number of Images */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Number of Images</Label>
                <div className="grid grid-cols-4 gap-2">
                  {NUM_IMAGES_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setNumImages(n as 1 | 2 | 3 | 4)}
                      className={`flex items-center justify-center py-2 rounded-lg border text-sm font-medium transition-colors ${
                        numImages === n
                          ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                          : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700 text-muted-foreground'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Panel - Image Display */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border bg-card p-5 min-h-[500px] flex flex-col">
              {isGenerating ? (
                /* Loading state */
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Wand2 className="h-12 w-12 text-emerald-500" />
                  </motion.div>
                  <div className="text-center space-y-2">
                    <p className="font-medium text-foreground">Creating your image...</p>
                    <p className="text-sm text-muted-foreground">
                      This may take a moment. AI is working its magic.
                    </p>
                  </div>
                  <div className="w-full max-w-sm">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-3/4 mx-auto" />
                      <div className="grid grid-cols-2 gap-2">
                        <Skeleton className="aspect-square rounded-lg" />
                        <Skeleton className="aspect-square rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : generatedImage ? (
                /* Image result */
                <div className="flex flex-col gap-4">
                  <div className="relative rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
                    <motion.img
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      src={generatedImage.imageUrl}
                      alt={generatedImage.prompt}
                      className="max-w-full max-h-[500px] object-contain mx-auto"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDownload(generatedImage.imageUrl, generatedImage.id)
                      }
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyPrompt(generatedImage.prompt)}
                    >
                      <Copy className="h-4 w-4 mr-1.5" />
                      Copy Prompt
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFavorite}
                      className={
                        isFavorited
                          ? 'text-rose-500 border-rose-200 dark:border-rose-800'
                          : ''
                      }
                    >
                      <Heart
                        className={`h-4 w-4 mr-1.5 ${isFavorited ? 'fill-current' : ''}`}
                      />
                      {isFavorited ? 'Favorited' : 'Favorite'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      disabled={!prompt.trim()}
                    >
                      <RefreshCw className="h-4 w-4 mr-1.5" />
                      Regenerate
                    </Button>
                  </div>

                  {/* Used prompt */}
                  <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Used prompt:</p>
                    <p className="text-sm text-foreground">{generatedImage.prompt}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {currentSizeOption?.label ?? generatedImage.size}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {generatedImage.quality}
                      </Badge>
                      {style && (
                        <Badge variant="secondary" className="text-xs">
                          {style}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4 mx-auto">
                      <ImageIcon className="h-8 w-8 text-emerald-600" />
                    </div>
                  </motion.div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Your Image Will Appear Here
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Write a prompt and click Generate to create your image
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="space-y-4">
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Gallery</h2>
              <p className="text-sm text-muted-foreground">Your previously generated images</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchGallery}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>

          {galleryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : gallery.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No images generated yet</p>
              <p className="text-xs mt-1">Your creations will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {gallery.map((img, index) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group relative rounded-lg border overflow-hidden bg-card cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setPreviewImage(img)}
                  >
                    <div className="aspect-square overflow-hidden">
                      {img.imageUrl ? (
                        <img
                          src={img.imageUrl}
                          alt={img.prompt}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                      <div className="w-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs line-clamp-2">{img.prompt}</p>
                        <div className="flex gap-1.5 mt-1.5">
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-white/20 text-white border-0"
                          >
                            {img.size}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {/* Zoom icon */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                        <ZoomIn className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => {
          if (!open) setPreviewImage(null)
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {previewImage && (
            <div className="flex flex-col">
              <div className="relative bg-muted/30 flex items-center justify-center max-h-[70vh] overflow-hidden">
                {previewImage.imageUrl ? (
                  <img
                    src={previewImage.imageUrl}
                    alt={previewImage.prompt}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                ) : (
                  <div className="w-full h-64 bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-foreground">{previewImage.prompt}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {previewImage.size}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {previewImage.quality}
                  </Badge>
                  {previewImage.style && (
                    <Badge variant="secondary" className="text-xs">
                      {previewImage.style}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(previewImage.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  {previewImage.imageUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDownload(previewImage.imageUrl, previewImage.id)
                      }
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Download
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyPrompt(previewImage.prompt)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy Prompt
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
