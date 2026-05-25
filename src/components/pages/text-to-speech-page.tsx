'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Volume2,
  Play,
  Pause,
  Download,
  Clock,
  Loader2,
  ChevronRight,
  User,
  Sparkles,
  Gauge,
  RotateCcw,
  Square,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface VoiceOption {
  id: string
  name: string
  gender: 'male' | 'female' | 'neutral'
  language: string
  description: string
}

interface TTSGeneration {
  id: string
  text: string
  voice: string
  language: string
  speed: number
  audioUrl: string | null
  duration: number
  fileSize: number
  createdAt: Date
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_CHARS = 5000

const VOICES: VoiceOption[] = [
  { id: 'alloy', name: 'Alloy', gender: 'neutral', language: 'English', description: 'Balanced and versatile' },
  { id: 'echo', name: 'Echo', gender: 'male', language: 'English', description: 'Deep and resonant' },
  { id: 'fable', name: 'Fable', gender: 'male', language: 'English', description: 'Warm and storytelling' },
  { id: 'onyx', name: 'Onyx', gender: 'male', language: 'English', description: 'Authoritative and clear' },
  { id: 'nova', name: 'Nova', gender: 'female', language: 'English', description: 'Bright and energetic' },
  { id: 'shimmer', name: 'Shimmer', gender: 'female', language: 'English', description: 'Soft and melodic' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'ru', label: 'Russian' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getGenderIcon(gender: string) {
  switch (gender) {
    case 'male':
      return '♂'
    case 'female':
      return '♀'
    default:
      return '⚧'
  }
}

function getGenderColor(gender: string) {
  switch (gender) {
    case 'male':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
    case 'female':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
    default:
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  }
}

// ─── Audio Wave Animation ────────────────────────────────────────────────────

function GeneratingAnimation() {
  return (
    <div className="flex items-center justify-center gap-1">
      {[...Array(7)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-emerald-500"
          animate={{
            height: [6, 28, 10, 24, 6],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TextToSpeechPage() {
  // State
  const [text, setText] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('alloy')
  const [language, setLanguage] = useState('en')
  const [speed, setSpeed] = useState([1.0])
  const [pitch, setPitch] = useState([1.0])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generation, setGeneration] = useState<TTSGeneration | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [history, setHistory] = useState<TTSGeneration[]>([])
  const [previewVoice, setPreviewVoice] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)

  const audioRef = useRef<HTMLAudioElement>(null)

  // ─── Character count ────────────────────────────────────────────────────

  const charCount = text.length
  const charPercentage = (charCount / MAX_CHARS) * 100
  const isOverLimit = charCount > MAX_CHARS

  // ─── Voice preview ─────────────────────────────────────────────────────

  const handleVoicePreview = (voiceId: string) => {
    // Simple toggle for demo purposes
    if (previewVoice === voiceId) {
      setPreviewVoice(null)
      return
    }
    setPreviewVoice(voiceId)
    // In production, this would play a short sample of the voice
    setTimeout(() => setPreviewVoice(null), 2000)
  }

  // ─── Generate Speech ───────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text to convert to speech')
      return
    }
    if (isOverLimit) {
      toast.error(`Text exceeds the ${MAX_CHARS.toLocaleString()} character limit`)
      return
    }

    setIsGenerating(true)
    setGeneration(null)

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice,
          language,
          speed: speed[0],
        }),
      })

      if (!response.ok) {
        throw new Error('Speech generation failed')
      }

      // Check if response is audio blob or JSON
      const contentType = response.headers.get('content-type')
      let audioUrl: string | null = null
      let duration = 0
      let fileSize = 0

      if (contentType?.includes('audio')) {
        const blob = await response.blob()
        fileSize = blob.size
        audioUrl = URL.createObjectURL(blob)
      } else {
        const data = await response.json()
        audioUrl = data.audioUrl || null
        duration = data.duration || 0
        fileSize = data.fileSize || 0
      }

      const newGeneration: TTSGeneration = {
        id: Date.now().toString(),
        text: text.trim(),
        voice: selectedVoice,
        language,
        speed: speed[0],
        audioUrl,
        duration,
        fileSize,
        createdAt: new Date(),
      }

      setGeneration(newGeneration)
      setHistory((prev) => [newGeneration, ...prev])
      toast.success('Speech generated successfully!')
    } catch (error) {
      toast.error('Failed to generate speech. Please try again.')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  // ─── Audio Controls ────────────────────────────────────────────────────

  const togglePlayback = () => {
    if (!audioRef.current || !generation?.audioUrl) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const stopPlayback = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setIsPlaying(false)
    setCurrentTime(0)
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

  const handleDownload = () => {
    if (!generation?.audioUrl) {
      toast.error('No audio available for download')
      return
    }
    const a = document.createElement('a')
    a.href = generation.audioUrl
    a.download = `tts-${generation.voice}-${Date.now()}.mp3`
    a.click()
  }

  const handleHistoryPlay = (item: TTSGeneration) => {
    setGeneration(item)
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleReset = () => {
    setText('')
    setGeneration(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setAudioDuration(0)
  }

  // ─── Selected voice info ───────────────────────────────────────────────

  const currentVoice = VOICES.find((v) => v.id === selectedVoice)

  // ─── Estimate duration ─────────────────────────────────────────────────

  const estimatedDuration = text.trim()
    ? Math.max(0, (text.trim().split(/\s+/).length / 150) * 60 / speed[0])
    : 0
  const estimatedFileSize = estimatedDuration * 16000 // rough estimate: 16KB per second of MP3

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Text to Speech
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate natural-sounding voiceovers from your text
          </p>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Input & Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Text Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Volume2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  Input Text
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter the text you want to convert to speech..."
                    className="min-h-[160px] resize-y text-sm leading-relaxed pr-16"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                    <span className={isOverLimit ? 'text-red-500 font-medium' : ''}>
                      {charCount.toLocaleString()}
                    </span>
                    /{MAX_CHARS.toLocaleString()}
                  </div>
                </div>

                {/* Character bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full transition-colors ${
                        isOverLimit
                          ? 'bg-red-500'
                          : charPercentage > 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(charPercentage, 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Up to {MAX_CHARS.toLocaleString()} characters per generation
                  </span>
                </div>

                {/* Estimate info */}
                {text.trim() && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 text-xs text-muted-foreground"
                  >
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      Est. {formatDuration(estimatedDuration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="size-3" />
                      Est. {formatFileSize(estimatedFileSize)}
                    </span>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Voice Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="size-4 text-emerald-600 dark:text-emerald-400" />
                  Voice Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Voice Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Voice</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {VOICES.map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice.id)}
                        className={`
                          relative flex flex-col items-start gap-1 rounded-lg border p-3
                          transition-all text-left group
                          ${
                            selectedVoice === voice.id
                              ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/20 ring-1 ring-emerald-400/30 dark:ring-emerald-600/30'
                              : 'border-muted hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-muted/50'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm">{voice.name}</span>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] px-1.5 py-0 ${getGenderColor(voice.gender)}`}
                            >
                              {getGenderIcon(voice.gender)}
                            </Badge>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleVoicePreview(voice.id)
                              }}
                              className="size-5 rounded-full flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                              title="Preview voice"
                            >
                              {previewVoice === voice.id ? (
                                <Square className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Play className="size-2.5 text-emerald-600 dark:text-emerald-400 ml-0.5" />
                              )}
                            </button>
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground leading-tight">
                          {voice.description}
                        </span>
                        {selectedVoice === voice.id && (
                          <motion.div
                            layoutId="voice-indicator"
                            className="absolute -top-px -right-px size-3 rounded-bl-lg rounded-tr-lg bg-emerald-500 flex items-center justify-center"
                          >
                            <Sparkles className="size-2 text-white" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Language & Speed */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Language */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Language</Label>
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

                  {/* Speed */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <Gauge className="size-3.5" />
                        Speed
                      </Label>
                      <span className="text-sm font-mono text-emerald-600 dark:text-emerald-400">
                        {speed[0].toFixed(1)}x
                      </span>
                    </div>
                    <Slider
                      value={speed}
                      onValueChange={setSpeed}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      className="py-2"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>0.5x</span>
                      <span>1.0x</span>
                      <span>2.0x</span>
                    </div>
                  </div>
                </div>

                {/* Pitch (decorative) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      Pitch
                      <Badge variant="outline" className="text-[9px] px-1 py-0 ml-1">
                        Coming Soon
                      </Badge>
                    </Label>
                    <span className="text-sm font-mono text-muted-foreground">
                      {pitch[0].toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={pitch}
                    onValueChange={setPitch}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    disabled
                    className="py-2 opacity-50"
                  />
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !text.trim() || isOverLimit}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-base"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Generating Speech...
                    </>
                  ) : (
                    <>
                      <Volume2 className="size-5" />
                      Generate Speech
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Generating State */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center gap-4 py-4">
                      <GeneratingAnimation />
                      <div className="text-center">
                        <p className="font-medium text-foreground">Generating your speech...</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Using {currentVoice?.name} voice at {speed[0].toFixed(1)}x speed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Output Section */}
          <AnimatePresence>
            {generation && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Volume2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                      Generated Audio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Audio Player */}
                    {generation.audioUrl && (
                      <div className="rounded-xl border bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-4">
                        <div className="flex items-center gap-4">
                          {/* Play/Pause Button */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-12 rounded-full border-emerald-300 bg-white text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/30 shrink-0"
                            onClick={togglePlayback}
                          >
                            {isPlaying ? (
                              <Pause className="size-5" />
                            ) : (
                              <Play className="size-5 ml-0.5" />
                            )}
                          </Button>

                          {/* Waveform / Progress */}
                          <div className="flex-1 space-y-1">
                            {/* Fake waveform visualization */}
                            <div className="flex items-center gap-[2px] h-10">
                              {[...Array(40)].map((_, i) => {
                                const height = Math.sin(i * 0.3) * 30 + Math.random() * 20 + 10
                                const progress = audioDuration > 0
                                  ? currentTime / audioDuration
                                  : 0
                                const isPast = i / 40 <= progress

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
                            {/* Time display */}
                            <div className="flex justify-between text-xs text-muted-foreground font-mono">
                              <span>{formatDuration(currentTime)}</span>
                              <span>{formatDuration(audioDuration || generation.duration)}</span>
                            </div>
                          </div>

                          {/* Stop Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground shrink-0"
                            onClick={stopPlayback}
                          >
                            <Square className="size-3.5" />
                          </Button>
                        </div>

                        {/* Hidden audio element */}
                        <audio
                          ref={audioRef}
                          src={generation.audioUrl}
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                          onEnded={handleAudioEnded}
                          className="hidden"
                        />
                      </div>
                    )}

                    {/* Audio Info */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {currentVoice?.name} Voice
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {speed[0].toFixed(1)}x Speed
                      </Badge>
                      {(generation.duration > 0 || audioDuration > 0) && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="size-3 mr-1" />
                          {formatDuration(audioDuration || generation.duration)}
                        </Badge>
                      )}
                      {generation.fileSize > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(generation.fileSize)}
                        </Badge>
                      )}
                    </div>

                    {/* Text Preview */}
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Source Text</p>
                      <p className="text-sm text-foreground line-clamp-3">{generation.text}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {generation.audioUrl && (
                        <Button
                          variant="outline"
                          onClick={handleDownload}
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                        >
                          <Download className="size-4 mr-2" />
                          Download Audio
                        </Button>
                      )}
                      <Button variant="ghost" onClick={handleReset}>
                        <RotateCcw className="size-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="size-4 text-emerald-600 dark:text-emerald-400" />
                Recent Generations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <Volume2 className="size-8 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground mt-2">
                    No generations yet
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Enter text and generate speech to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {history.map((item) => {
                    const voiceInfo = VOICES.find((v) => v.id === item.voice)
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleHistoryPlay(item)}
                        className="w-full text-left rounded-lg border border-transparent hover:border-muted hover:bg-muted/50 p-3 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {item.audioUrl ? (
                              <Play className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Volume2 className="size-3.5 text-muted-foreground shrink-0" />
                            )}
                            <p className="text-sm truncate">
                              {item.text.slice(0, 50)}{item.text.length > 50 ? '...' : ''}
                            </p>
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground shrink-0 ml-2" />
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 ${getGenderColor(voiceInfo?.gender || 'neutral')}`}
                          >
                            {voiceInfo?.name || item.voice}
                          </Badge>
                          <span>{item.speed.toFixed(1)}x</span>
                          <span>•</span>
                          <span>
                            {item.createdAt.toLocaleDateString()} {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
