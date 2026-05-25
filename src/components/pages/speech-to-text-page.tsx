'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  Upload,
  FileAudio,
  Play,
  Pause,
  Copy,
  Download,
  RotateCcw,
  X,
  Clock,
  Languages,
  Check,
  Loader2,
  FileText,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TranscriptionSegment {
  start: number
  end: number
  text: string
}

interface TranscriptionResult {
  text: string
  language: string
  duration: number
  segments: TranscriptionSegment[]
}

interface HistoryItem {
  id: string
  fileName: string
  fileSize: number
  duration: number
  language: string
  date: Date
  result: TranscriptionResult
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SUPPORTED_FORMATS = ['mp3', 'mp4', 'wav', 'm4a', 'webm']
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

const LANGUAGES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ru', label: 'Russian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

function getLanguageName(code: string): string {
  const lang = LANGUAGES.find((l) => l.value === code)
  return lang ? lang.label : code.toUpperCase()
}

function getFileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() || ''
}

// ─── Audio Wave Animation ────────────────────────────────────────────────────

function AudioWaveAnimation() {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-2 rounded-full bg-emerald-500"
          animate={{
            height: [8, 32, 14, 28, 8],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SpeechToTextPage() {
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [language, setLanguage] = useState('auto')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null)
  const [editedText, setEditedText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // ─── File handling ────────────────────────────────────────────────────────

  const validateFile = useCallback((file: File): string | null => {
    const ext = getFileExtension(file.name)
    if (!SUPPORTED_FORMATS.includes(ext)) {
      return `Unsupported format. Supported: ${SUPPORTED_FORMATS.join(', ').toUpperCase()}`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds the ${formatFileSize(MAX_FILE_SIZE)} limit`
    }
    return null
  }, [])

  const handleFileSelect = useCallback(
    (file: File) => {
      const error = validateFile(file)
      if (error) {
        toast.error(error)
        return
      }
      setSelectedFile(file)
      setTranscription(null)
      setEditedText('')
      setIsEditing(false)

      // Create audio URL for preview
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      const url = URL.createObjectURL(file)
      setAudioUrl(url)
    },
    [validateFile, audioUrl]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setTranscription(null)
    setEditedText('')
    setIsEditing(false)
    setIsPlaying(false)
    setCurrentTime(0)
    setAudioDuration(0)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ─── Transcription ────────────────────────────────────────────────────────

  const handleTranscribe = async () => {
    if (!selectedFile) return

    setIsTranscribing(true)
    setTranscription(null)
    setEditedText('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('language', language)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Transcription failed')
      }

      const data: TranscriptionResult = await response.json()
      setTranscription(data)
      setEditedText(data.text)

      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        duration: data.duration,
        language: data.language,
        date: new Date(),
        result: data,
      }
      setHistory((prev) => [historyItem, ...prev])

      toast.success('Transcription completed successfully!')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Transcription failed. Please try again.'
      )
    } finally {
      setIsTranscribing(false)
    }
  }

  // ─── Audio controls ───────────────────────────────────────────────────────

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  // ─── Result actions ───────────────────────────────────────────────────────

  const handleCopyText = () => {
    const textToCopy = isEditing ? editedText : transcription?.text || ''
    if (!textToCopy) return
    navigator.clipboard.writeText(textToCopy)
    toast.success('Text copied to clipboard')
  }

  const handleDownloadTxt = () => {
    const textToDownload = isEditing ? editedText : transcription?.text || ''
    if (!textToDownload) return
    const blob = new Blob([textToDownload], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'transcription'}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded as .txt')
  }

  const handleDownloadSrt = () => {
    if (!transcription?.segments) return
    const srtContent = transcription.segments
      .map((seg, idx) => {
        const start = formatTimestamp(seg.start).replace('.', ',')
        const end = formatTimestamp(seg.end).replace('.', ',')
        return `${idx + 1}\n00:${start} --> 00:${end}\n${seg.text}\n`
      })
      .join('\n')

    const blob = new Blob([srtContent], { type: 'text/srt' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'transcription'}.srt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded as .srt')
  }

  const handleRegenerate = () => {
    handleTranscribe()
  }

  const handleHistoryClick = (item: HistoryItem) => {
    setTranscription(item.result)
    setEditedText(item.result.text)
    setIsEditing(false)
    toast.info('Loaded transcription from history')
  }

  const handleClearHistory = () => {
    setHistory([])
    toast.success('History cleared')
  }

  // ─── Word & char counts ───────────────────────────────────────────────────

  const currentText = isEditing ? editedText : transcription?.text || ''
  const wordCount = currentText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  const charCount = currentText.length

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Mic className="size-6 text-emerald-500" />
          Speech to Text
        </h1>
        <p className="text-muted-foreground mt-1">
          Convert speech to text with AI-powered transcription
        </p>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Upload & Result */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Section */}
          {!selectedFile ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      relative flex flex-col items-center justify-center min-h-[300px] rounded-xl border-2 border-dashed
                      transition-all duration-200 cursor-pointer
                      ${
                        isDragging
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                          : 'border-muted-foreground/25 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-muted/30'
                      }
                    `}
                    onClick={handleBrowseClick}
                  >
                    {/* Upload Icon */}
                    <div
                      className={`size-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                        isDragging
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isDragging ? (
                        <Mic className="size-8" />
                      ) : (
                        <Upload className="size-8" />
                      )}
                    </div>

                    <p className="text-base font-medium text-foreground">
                      {isDragging
                        ? 'Drop your audio file here'
                        : 'Drag & drop your audio file here'}
                    </p>

                    <div className="flex items-center gap-3 my-3">
                      <Separator className="w-12" />
                      <span className="text-xs text-muted-foreground font-medium">
                        or
                      </span>
                      <Separator className="w-12" />
                    </div>

                    <Button
                      type="button"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBrowseClick()
                      }}
                    >
                      <Upload className="size-4 mr-2" />
                      Browse Files
                    </Button>

                    {/* Supported formats */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                      {SUPPORTED_FORMATS.map((fmt) => (
                        <Badge
                          key={fmt}
                          variant="secondary"
                          className="text-[10px] font-mono uppercase px-2 py-0.5"
                        >
                          {fmt}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      Max file size: 25MB
                    </p>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={SUPPORTED_FORMATS.map((f) => `.${f}`).join(',')}
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* File Selected State */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* File Info Card */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="size-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                      <FileAudio className="size-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate pr-2">
                          {selectedFile.name}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={handleRemoveFile}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getFileExtension(selectedFile.name).toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </span>
                        {audioDuration > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatDuration(audioDuration)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Audio Preview */}
                  {audioUrl && (
                    <div className="mt-4 rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9 rounded-full border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 shrink-0"
                          onClick={togglePlayback}
                        >
                          {isPlaying ? (
                            <Pause className="size-4" />
                          ) : (
                            <Play className="size-4 ml-0.5" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <div className="flex items-center gap-[2px] h-8">
                            {[...Array(30)].map((_, i) => {
                              const height =
                                Math.sin(i * 0.4) * 40 + Math.random() * 25 + 15
                              const progress =
                                audioDuration > 0
                                  ? currentTime / audioDuration
                                  : 0
                              const isPast = i / 30 <= progress

                              return (
                                <div
                                  key={i}
                                  className={`flex-1 rounded-full transition-colors ${
                                    isPast
                                      ? 'bg-emerald-500 dark:bg-emerald-400'
                                      : 'bg-emerald-200 dark:bg-emerald-800'
                                  }`}
                                  style={{ height: `${height}%` }}
                                />
                              )
                            })}
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                            <span>{formatDuration(currentTime)}</span>
                            <span>{formatDuration(audioDuration)}</span>
                          </div>
                        </div>
                      </div>
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={handleAudioEnded}
                        className="hidden"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Language & Transcribe Button */}
              {!transcription && !isTranscribing && (
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                      <div className="flex-1 space-y-2 w-full sm:w-auto">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                          <Languages className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          Language
                        </Label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGES.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleTranscribe}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-8 text-base font-semibold"
                        size="lg"
                      >
                        <Mic className="size-5 mr-2" />
                        Transcribe Audio
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Processing State */}
          <AnimatePresence>
            {isTranscribing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center gap-5">
                      <AudioWaveAnimation />
                      <div className="text-center">
                        <p className="font-medium text-foreground text-base">
                          Transcribing your audio...
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          AI is processing your file. This may take a moment.
                        </p>
                      </div>
                      <div className="w-full max-w-xs">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-emerald-500"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 8, ease: 'linear' }}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => {
                          setIsTranscribing(false)
                          toast.info('Transcription cancelled')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result Section */}
          <AnimatePresence>
            {transcription && !isTranscribing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="size-4 text-emerald-600 dark:text-emerald-400" />
                        Transcription Result
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        >
                          {getLanguageName(transcription.language)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="size-3 mr-1" />
                          {formatDuration(transcription.duration)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Segments */}
                    {transcription.segments &&
                      transcription.segments.length > 0 &&
                      !isEditing && (
                        <div className="space-y-1 rounded-lg border bg-muted/20 p-3 max-h-48 overflow-y-auto custom-scrollbar">
                          {transcription.segments.map((seg, idx) => (
                            <div
                              key={idx}
                              className="flex gap-3 py-1.5 text-sm hover:bg-muted/50 rounded px-2 transition-colors"
                            >
                              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 shrink-0 pt-0.5 min-w-[100px]">
                                {formatTimestamp(seg.start)} → {formatTimestamp(seg.end)}
                              </span>
                              <span className="text-foreground">{seg.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Transcription Text */}
                    {isEditing ? (
                      <Textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="min-h-[200px] text-sm leading-relaxed resize-y"
                      />
                    ) : (
                      <div className="rounded-lg border bg-muted/20 p-4">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {transcription.text}
                        </p>
                      </div>
                    )}

                    {/* Word & Char count */}
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {wordCount} words
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {charCount.toLocaleString()} characters
                      </Badge>
                    </div>

                    {/* Toolbar */}
                    <Separator />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyText}
                        className="text-xs"
                      >
                        <Copy className="size-3.5 mr-1.5" />
                        Copy Text
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTxt}
                        className="text-xs"
                      >
                        <Download className="size-3.5 mr-1.5" />
                        Download .txt
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadSrt}
                        className="text-xs"
                      >
                        <Download className="size-3.5 mr-1.5" />
                        Download .srt
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerate}
                        className="text-xs"
                      >
                        <RotateCcw className="size-3.5 mr-1.5" />
                        Regenerate
                      </Button>
                      <div className="ml-auto">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                setIsEditing(false)
                                setEditedText(transcription.text)
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => {
                                setIsEditing(false)
                                toast.success('Changes saved')
                              }}
                            >
                              <Check className="size-3.5 mr-1.5" />
                              Save
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setIsEditing(true)}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Audio reference player (shown below results) */}
                {audioUrl && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9 rounded-full border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 shrink-0"
                          onClick={togglePlayback}
                        >
                          {isPlaying ? (
                            <Pause className="size-4" />
                          ) : (
                            <Play className="size-4 ml-0.5" />
                          )}
                        </Button>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground truncate">
                            {selectedFile?.name}
                          </p>
                          <div className="flex items-center gap-[2px] h-5 mt-1">
                            {[...Array(30)].map((_, i) => {
                              const height =
                                Math.sin(i * 0.4) * 40 +
                                Math.random() * 25 +
                                15
                              const progress =
                                audioDuration > 0
                                  ? currentTime / audioDuration
                                  : 0
                              const isPast = i / 30 <= progress
                              return (
                                <div
                                  key={i}
                                  className={`flex-1 rounded-full transition-colors ${
                                    isPast
                                      ? 'bg-emerald-500 dark:bg-emerald-400'
                                      : 'bg-emerald-200 dark:bg-emerald-800'
                                  }`}
                                  style={{ height: `${height}%` }}
                                />
                              )
                            })}
                          </div>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground shrink-0">
                          {formatDuration(currentTime)} /{' '}
                          {formatDuration(audioDuration)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column - History */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="size-4 text-emerald-600 dark:text-emerald-400" />
                  Recent Transcriptions
                </CardTitle>
                {history.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
                    onClick={handleClearHistory}
                  >
                    <Trash2 className="size-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <Mic className="size-8 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground mt-2">
                    No transcriptions yet
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Upload an audio file to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleHistoryClick(item)}
                      className="w-full text-left rounded-lg border border-transparent hover:border-muted hover:bg-muted/50 p-3 transition-all group"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-0.5">
                          <FileAudio className="size-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {item.fileName}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {getLanguageName(item.language)}
                            </Badge>
                            <span className="flex items-center gap-0.5">
                              <Clock className="size-2.5" />
                              {formatDuration(item.duration)}
                            </span>
                            <span>
                              {item.date.toLocaleDateString()}{' '}
                              {item.date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
