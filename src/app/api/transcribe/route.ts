import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/ai-helpers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const language = (formData.get('language') as string) || 'auto';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (25MB max)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 25MB limit' },
        { status: 400 }
      );
    }

    // Validate file format
    const supportedFormats = ['mp3', 'mp4', 'wav', 'm4a', 'webm'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !supportedFormats.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported format. Supported: ${supportedFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Convert the uploaded file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    // Determine language for the API call (use 'en' if auto-detect)
    const apiLanguage = language === 'auto' ? undefined : language;

    // Call the real transcription helper
    const transcribedText = await transcribeAudio(base64Audio, apiLanguage);

    // Determine detected language
    const detectedLanguage = language === 'auto'
      ? detectLanguageFromText(transcribedText)
      : language;

    // Estimate duration based on text length (rough heuristic: ~150 words/min)
    const wordCount = transcribedText.split(/\s+/).filter(Boolean).length;
    const estimatedDuration = Math.round((wordCount / 150) * 60 * 10) / 10;

    // Build segments by splitting on sentence boundaries with estimated timestamps
    const segments = buildSegments(transcribedText, estimatedDuration);

    return NextResponse.json({
      text: transcribedText,
      language: detectedLanguage,
      duration: estimatedDuration,
      segments,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Simple language detection based on character patterns.
 * Falls back to 'en' if no clear pattern is found.
 */
function detectLanguageFromText(text: string): string {
  // Check for CJK characters
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';

  // Check for Cyrillic
  if (/[\u0400-\u04ff]/.test(text)) return 'ru';

  // Check for Arabic
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';

  // Check for Devanagari
  if (/[\u0900-\u097f]/.test(text)) return 'hi';

  // Default to English
  return 'en';
}

/**
 * Splits transcribed text into sentence-based segments with estimated timestamps.
 */
function buildSegments(
  text: string,
  totalDuration: number
): Array<{ start: number; end: number; text: string }> {
  // Split on sentence-ending punctuation, keeping the delimiter
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const matches = text.match(sentenceRegex);

  if (!matches || matches.length === 0) {
    // If no sentence boundaries found, return the whole text as one segment
    return [
      {
        start: 0,
        end: totalDuration,
        text: text.trim(),
      },
    ];
  }

  // Clean up sentences
  const sentences = matches.map((s) => s.trim()).filter(Boolean);

  // If there's remaining text after the last matched sentence, append it
  const lastMatchEnd = sentenceRegex.lastIndex;
  const remaining = text.slice(lastMatchEnd).trim();
  if (remaining && sentences.length > 0) {
    sentences[sentences.length - 1] += ' ' + remaining;
  }

  // Distribute timestamps proportionally by character count
  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
  const segments: Array<{ start: number; end: number; text: string }> = [];

  let currentTime = 0;
  for (const sentence of sentences) {
    const proportion = sentence.length / totalChars;
    const segmentDuration = proportion * totalDuration;
    const endTime = Math.min(currentTime + segmentDuration, totalDuration);

    segments.push({
      start: Math.round(currentTime * 10) / 10,
      end: Math.round(endTime * 10) / 10,
      text: sentence,
    });

    currentTime = endTime;
  }

  return segments;
}
