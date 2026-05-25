import ZAI from 'z-ai-web-dev-sdk';

// ─── NVIDIA Model Configuration ─────────────────────────────────────────────────

export const NVIDIA_MODELS = {
  // Chat / Text Generation Models
  chat: [
    { value: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Nemotron 70B', provider: 'NVIDIA', category: 'flagship' },
    { value: 'meta/llama-3.1-405b-instruct', label: 'Llama 3.1 405B', provider: 'Meta', category: 'flagship' },
    { value: 'meta/llama-3.1-70b-instruct', label: 'Llama 3.1 70B', provider: 'Meta', category: 'advanced' },
    { value: 'meta/llama-3.1-8b-instruct', label: 'Llama 3.1 8B', provider: 'Meta', category: 'fast' },
    { value: 'mistralai/mixtral-8x22b-instruct', label: 'Mixtral 8x22B', provider: 'Mistral', category: 'advanced' },
    { value: 'mistralai/mistral-large', label: 'Mistral Large', provider: 'Mistral', category: 'flagship' },
    { value: 'google/gemma-2-27b-it', label: 'Gemma 2 27B', provider: 'Google', category: 'advanced' },
    { value: 'microsoft/phi-3-medium-128k-instruct', label: 'Phi-3 Medium', provider: 'Microsoft', category: 'fast' },
    { value: 'snowflake/arctic', label: 'Arctic', provider: 'Snowflake', category: 'advanced' },
    { value: 'qwen/qwen2.5-72b-instruct', label: 'Qwen 2.5 72B', provider: 'Qwen', category: 'advanced' },
    { value: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1', provider: 'DeepSeek', category: 'reasoning' },
    { value: 'deepseek-ai/deepseek-v3', label: 'DeepSeek V3', provider: 'DeepSeek', category: 'flagship' },
  ],

  // Code Generation Models
  code: [
    { value: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Nemotron 70B', provider: 'NVIDIA' },
    { value: 'meta/llama-3.1-70b-instruct', label: 'Llama 3.1 70B', provider: 'Meta' },
    { value: 'meta/llama-3.1-405b-instruct', label: 'Llama 3.1 405B', provider: 'Meta' },
    { value: 'mistralai/mixtral-8x22b-instruct', label: 'Mixtral 8x22B', provider: 'Mistral' },
    { value: 'qwen/qwen2.5-coder-32b-instruct', label: 'Qwen Coder 32B', provider: 'Qwen' },
    { value: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1', provider: 'DeepSeek' },
  ],

  // Image Generation Models
  image: [
    { value: 'stabilityai/stable-diffusion-xl', label: 'Stable Diffusion XL', provider: 'Stability AI' },
    { value: 'stabilityai/stable-diffusion-3.5-large', label: 'Stable Diffusion 3.5', provider: 'Stability AI' },
    { value: 'stabilityai/stable-diffusion-3.5-large-turbo', label: 'SD 3.5 Turbo', provider: 'Stability AI' },
    { value: 'black-forest-labs/flux-1-dev', label: 'FLUX.1 Dev', provider: 'Black Forest Labs' },
    { value: 'black-forest-labs/flux-1-schnell', label: 'FLUX.1 Schnell', provider: 'Black Forest Labs' },
  ],

  // Reasoning Models
  reasoning: [
    { value: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1', provider: 'DeepSeek' },
    { value: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Nemotron 70B', provider: 'NVIDIA' },
    { value: 'meta/llama-3.1-405b-instruct', label: 'Llama 3.1 405B', provider: 'Meta' },
  ],
} as const;

// Default model selections
export const DEFAULT_MODELS = {
  chat: 'nvidia/llama-3.1-nemotron-70b-instruct',
  code: 'nvidia/llama-3.1-nemotron-70b-instruct',
  image: 'stabilityai/stable-diffusion-xl',
  writer: 'nvidia/llama-3.1-nemotron-70b-instruct',
  reasoning: 'deepseek-ai/deepseek-r1',
};

// ─── NVIDIA Provider Info ────────────────────────────────────────────────────────

export const NVIDIA_PROVIDER_INFO = {
  name: 'NVIDIA NIM',
  description: 'NVIDIA Inference Microservices',
  baseUrl: 'https://integrate.api.nvidia.com/v1',
  docsUrl: 'https://build.nvidia.com/explore/discover',
};

// ─── ZAI Instance Management ────────────────────────────────────────────────────

let zaiInstance: InstanceType<typeof ZAI> | null = null;

/**
 * Creates and returns a cached ZAI instance
 */
export async function createZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// ─── Text Generation ────────────────────────────────────────────────────────────

/**
 * Generates text using LLM chat completions via NVIDIA NIM
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
 * Generates text with multi-turn conversation context
 */
export async function generateTextWithContext(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  _model?: string
): Promise<string> {
  const zai = await createZAI();
  const result = await zai.chat.completions.create({
    messages,
    thinking: { type: 'disabled' },
  });

  const choice = result.choices?.[0];
  if (choice?.message?.content) {
    return choice.message.content;
  }

  if (typeof result === 'string') {
    return result;
  }

  return JSON.stringify(result);
}

/**
 * Generates text with reasoning / thinking enabled
 */
export async function generateWithReasoning(
  systemPrompt: string,
  userPrompt: string,
  _model?: string
): Promise<{ content: string; reasoning?: string }> {
  const zai = await createZAI();
  const result = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'enabled' },
  });

  const choice = result.choices?.[0];
  const content = choice?.message?.content || '';
  const reasoning = (choice?.message as Record<string, unknown>)?.reasoning as string | undefined;

  return {
    content: typeof content === 'string' ? content : JSON.stringify(content),
    reasoning,
  };
}

// ─── Image Generation ───────────────────────────────────────────────────────────

/**
 * Generates an image using NVIDIA NIM / Stability AI models
 */
export async function generateImage(
  prompt: string,
  options?: {
    size?: string;
    quality?: string;
    style?: string;
    model?: string;
    negativePrompt?: string;
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

// ─── Speech-to-Text ─────────────────────────────────────────────────────────────

/**
 * Transcribes audio using the ASR capability via NVIDIA
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

// ─── Text-to-Speech ─────────────────────────────────────────────────────────────

/**
 * Converts text to speech via NVIDIA
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
