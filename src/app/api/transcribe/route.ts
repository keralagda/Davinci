import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const language = (formData.get('language') as string) || 'auto'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (25MB max)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 25MB limit' },
        { status: 400 }
      )
    }

    // Validate file format
    const supportedFormats = ['mp3', 'mp4', 'wav', 'm4a', 'webm']
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !supportedFormats.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported format. Supported: ${supportedFormats.join(', ')}` },
        { status: 400 }
      )
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock transcription response
    // In production, this would call a real speech-to-text API
    const detectedLanguage = language === 'auto' ? 'en' : language

    const mockTranscription = {
      text: 'This is a sample transcription of the uploaded audio file. The AI-powered speech recognition system has processed your audio and generated this text output. You can edit this transcription, copy it to your clipboard, or download it in various formats including plain text and SRT subtitle format.',
      language: detectedLanguage,
      duration: 42,
      segments: [
        {
          start: 0,
          end: 5.2,
          text: 'This is a sample transcription of the uploaded audio file.',
        },
        {
          start: 5.2,
          end: 12.8,
          text: 'The AI-powered speech recognition system has processed your audio and generated this text output.',
        },
        {
          start: 12.8,
          end: 20.5,
          text: 'You can edit this transcription, copy it to your clipboard, or download it in various formats.',
        },
        {
          start: 20.5,
          end: 26.0,
          text: 'Including plain text and SRT subtitle format.',
        },
      ],
    }

    return NextResponse.json(mockTranscription)
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Transcription failed. Please try again.' },
      { status: 500 }
    )
  }
}
