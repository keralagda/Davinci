import { NextRequest, NextResponse } from 'next/server';
import { textToSpeech } from '@/lib/ai-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice, language, speed } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text exceeds 5000 character limit' },
        { status: 400 }
      );
    }

    // Validate voice
    const supportedVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const selectedVoice = voice || 'alloy';
    if (voice && !supportedVoices.includes(voice)) {
      return NextResponse.json(
        { error: `Unsupported voice. Supported: ${supportedVoices.join(', ')}` },
        { status: 400 }
      );
    }

    const selectedSpeed = speed || 1;
    const selectedLanguage = language || 'en';

    // Call the real TTS helper
    const result = await textToSpeech(text, {
      voice: selectedVoice,
      language: selectedLanguage,
      speed: selectedSpeed,
    });

    // Estimate duration based on word count and speed
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const estimatedDuration = Math.round(((wordCount / 150) * 60) / selectedSpeed * 10) / 10;

    // If we got a URL back, return it directly
    if (result.url && !result.audioData) {
      return NextResponse.json({
        audioUrl: result.url,
        duration: estimatedDuration,
        fileSize: Math.round(estimatedDuration * 16000),
        voice: selectedVoice,
        language: selectedLanguage,
        speed: selectedSpeed,
        format: 'mp3',
      });
    }

    // If we got audioData (base64), construct a data URL
    if (result.audioData) {
      const audioData = result.audioData.startsWith('data:')
        ? result.audioData
        : `data:audio/mp3;base64,${result.audioData}`;

      // Estimate file size from base64 length
      const base64Length = result.audioData.replace(/^data:audio\/\w+;base64,/, '').length;
      const estimatedFileSize = Math.round(base64Length * 0.75);

      return NextResponse.json({
        audioUrl: audioData,
        duration: estimatedDuration,
        fileSize: estimatedFileSize,
        voice: selectedVoice,
        language: selectedLanguage,
        speed: selectedSpeed,
        format: 'mp3',
      });
    }

    // Fallback — if we got neither URL nor audioData, return an error
    return NextResponse.json(
      { error: 'No audio data received from TTS service' },
      { status: 500 }
    );
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: 'Speech generation failed. Please try again.' },
      { status: 500 }
    );
  }
}
