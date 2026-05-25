import ZAI from 'z-ai-web-dev-sdk';

/**
 * Creates and returns a ZAI instance
 */
export async function createZAI() {
  return await ZAI.create();
}

/**
 * Generates text using LLM chat completions
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  _model?: string
): Promise<string> {
  const zai = await createZAI();
  const result = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  });

  // Extract the assistant's reply from the response
  const choice = result.choices?.[0];
  if (choice?.message?.content) {
    return choice.message.content;
  }

  // Fallback: if the result itself is a string
  if (typeof result === 'string') {
    return result;
  }

  return JSON.stringify(result);
}

/**
 * Generates an image using the AI SDK
 */
export async function generateImage(
  prompt: string,
  options?: {
    size?: string;
    quality?: string;
    style?: string;
  }
): Promise<{ data: string; url?: string }> {
  const zai = await createZAI();
  const result = await zai.image.generate({
    prompt,
    size: (options?.size as '1024x1024' | '1024x1792' | '1792x1024') ?? '1024x1024',
    quality: (options?.quality as 'standard' | 'hd') ?? 'standard',
  });

  // The result may contain base64 data or a URL
  if (typeof result === 'object' && result !== null) {
    const res = result as Record<string, unknown>;
    if (res.data) {
      return { data: res.data as string, url: res.url as string | undefined };
    }
    if (res.url) {
      return { data: '', url: res.url as string };
    }
  }

  if (typeof result === 'string') {
    // Could be a URL or base64
    if (result.startsWith('http')) {
      return { data: '', url: result };
    }
    return { data: result, url: undefined };
  }

  return { data: JSON.stringify(result), url: undefined };
}

/**
 * Transcribes audio using the ASR capability
 */
export async function transcribeAudio(
  audioBase64: string,
  language?: string
): Promise<string> {
  const zai = await createZAI();
  const result = await zai.asr.transcribe({
    audio: audioBase64,
    language: language ?? 'en',
  });

  if (typeof result === 'string') {
    return result;
  }

  const res = result as Record<string, unknown>;
  if (res.text) {
    return res.text as string;
  }

  if (res.transcript) {
    return res.transcript as string;
  }

  return JSON.stringify(result);
}

/**
 * Converts text to speech
 */
export async function textToSpeech(
  text: string,
  options?: {
    voice?: string;
    language?: string;
    speed?: number;
  }
): Promise<{ audioData: string; url?: string }> {
  const zai = await createZAI();
  const result = await zai.tts.synthesize({
    text,
    voice: options?.voice ?? 'alloy',
    language: options?.language ?? 'en',
  });

  if (typeof result === 'object' && result !== null) {
    const res = result as Record<string, unknown>;
    if (res.audio) {
      return { audioData: res.audio as string, url: res.url as string | undefined };
    }
    if (res.data) {
      return { audioData: res.data as string, url: res.url as string | undefined };
    }
    if (res.url) {
      return { audioData: '', url: res.url as string };
    }
    if (res.audioContent) {
      return { audioData: res.audioContent as string, url: undefined };
    }
  }

  if (typeof result === 'string') {
    if (result.startsWith('http')) {
      return { audioData: '', url: result };
    }
    return { audioData: result, url: undefined };
  }

  return { audioData: JSON.stringify(result), url: undefined };
}
