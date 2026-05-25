// ─── AI Helpers — Direct API calls to NVIDIA, Cloudflare Workers AI, Bytez ────
// Priority: NVIDIA NIM > Cloudflare Workers AI > Bytez

// ─── Provider Configuration ─────────────────────────────────────────────────────

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_IMAGE_BASE_URL = 'https://ai.api.nvidia.com/v1/genai';

function getCloudflareBaseUrl() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run`;
}

const BYTEZ_BASE_URL = 'https://api.bytez.com/models/v2';

// ─── Model Configuration ────────────────────────────────────────────────────────

export const NVIDIA_MODELS = {
  chat: [
    { value: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', label: 'Nemotron Ultra 253B', provider: 'NVIDIA', category: 'flagship' },
    { value: 'nvidia/llama-3.3-nemotron-super-49b-v1', label: 'Nemotron Super 49B', provider: 'NVIDIA', category: 'advanced' },
    { value: 'meta/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', provider: 'Meta', category: 'advanced' },
    { value: 'meta/llama-3.1-8b-instruct', label: 'Llama 3.1 8B', provider: 'Meta', category: 'fast' },
    { value: 'mistralai/mistral-nemotron', label: 'Mistral Nemotron', provider: 'Mistral', category: 'flagship' },
    { value: 'qwen/qwq-32b', label: 'QwQ 32B', provider: 'Qwen', category: 'reasoning' },
    { value: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1', provider: 'DeepSeek', category: 'reasoning' },
    { value: '@cf/meta/llama-3-8b-instruct', label: 'Llama 3 8B (CF)', provider: 'Cloudflare', category: 'fast' },
    { value: '@cf/qwen/qwen1.5-14b-chat', label: 'Qwen 1.5 14B (CF)', provider: 'Cloudflare', category: 'advanced' },
  ],

  code: [
    { value: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', label: 'Nemotron Ultra 253B', provider: 'NVIDIA' },
    { value: 'nvidia/llama-3.3-nemotron-super-49b-v1', label: 'Nemotron Super 49B', provider: 'NVIDIA' },
    { value: 'qwen/qwen2.5-coder-32b-instruct', label: 'Qwen Coder 32B', provider: 'Qwen' },
    { value: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1', provider: 'DeepSeek' },
    { value: '@cf/deepseek-ai/deepseek-coder-6.7b-instruct', label: 'DeepSeek Coder 6.7B (CF)', provider: 'Cloudflare' },
  ],

  image: [
    { value: 'stabilityai/stable-diffusion-xl', label: 'Stable Diffusion XL (NVIDIA)', provider: 'NVIDIA' },
    { value: '@cf/black-forest-labs/flux-1-schnell', label: 'FLUX.1 Schnell (CF)', provider: 'Cloudflare' },
    { value: '@cf/stabilityai/stable-diffusion-xl-base-1.0', label: 'SDXL Base (CF)', provider: 'Cloudflare' },
  ],

  reasoning: [
    { value: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1', provider: 'DeepSeek' },
    { value: 'qwen/qwq-32b', label: 'QwQ 32B', provider: 'Qwen' },
    { value: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', label: 'Nemotron Ultra 253B', provider: 'NVIDIA' },
  ],
} as const;

export const DEFAULT_MODELS = {
  chat: 'nvidia/llama-3.3-nemotron-super-49b-v1',
  code: 'nvidia/llama-3.3-nemotron-super-49b-v1',
  image: '@cf/black-forest-labs/flux-1-schnell',
  writer: 'nvidia/llama-3.3-nemotron-super-49b-v1',
  reasoning: 'deepseek-ai/deepseek-r1',
};

export const NVIDIA_PROVIDER_INFO = {
  name: 'NVIDIA NIM',
  description: 'NVIDIA Inference Microservices',
  baseUrl: NVIDIA_BASE_URL,
  docsUrl: 'https://build.nvidia.com/explore/discover',
};

// ─── Provider Detection ─────────────────────────────────────────────────────────

type Provider = 'nvidia' | 'cloudflare' | 'bytez';

function detectProvider(model: string): Provider {
  if (model.startsWith('@cf/')) return 'cloudflare';
  if (model.startsWith('bytez/')) return 'bytez';
  return 'nvidia';
}

// ─── NVIDIA Chat Completions ────────────────────────────────────────────────────

async function nvidiaChat(
  messages: Array<{ role: string; content: string }>,
  model: string
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY not configured');

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── Cloudflare Workers AI Chat ─────────────────────────────────────────────────

async function cloudflareChat(
  messages: Array<{ role: string; content: string }>,
  model: string
): Promise<string> {
  const apiKey = process.env.CLOUDFLARE_API_KEY;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!apiKey || !accountId) throw new Error('Cloudflare credentials not configured');

  const cfModel = model.startsWith('@cf/') ? model : `@cf/${model}`;
  const url = `${getCloudflareBaseUrl()}/${cfModel}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare AI error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as {
    result?: { response?: string };
  };
  return data.result?.response ?? '';
}

// ─── Bytez Chat ─────────────────────────────────────────────────────────────────

async function bytezChat(
  messages: Array<{ role: string; content: string }>,
  model: string
): Promise<string> {
  const apiKey = process.env.BYTEZ_API_KEY;
  if (!apiKey) throw new Error('BYTEZ_API_KEY not configured');

  const modelId = model.startsWith('bytez/') ? model.slice(6) : model;

  const response = await fetch(`${BYTEZ_BASE_URL}/${modelId}`, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bytez API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as {
    output?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  return data.output ?? JSON.stringify(data);
}

// ─── Unified Chat Router ────────────────────────────────────────────────────────

async function chatWithFallback(
  messages: Array<{ role: string; content: string }>,
  model: string
): Promise<string> {
  const provider = detectProvider(model);

  // Try primary provider
  try {
    switch (provider) {
      case 'cloudflare':
        return await cloudflareChat(messages, model);
      case 'bytez':
        return await bytezChat(messages, model);
      default:
        return await nvidiaChat(messages, model);
    }
  } catch (primaryError) {
    console.error(`Primary provider (${provider}) failed:`, primaryError);
  }

  // Fallback chain: NVIDIA → Cloudflare → Bytez
  if (provider !== 'nvidia') {
    try {
      return await nvidiaChat(messages, DEFAULT_MODELS.chat);
    } catch (e) {
      console.error('NVIDIA fallback failed:', e);
    }
  }

  if (provider !== 'cloudflare') {
    try {
      return await cloudflareChat(messages, '@cf/meta/llama-3-8b-instruct');
    } catch (e) {
      console.error('Cloudflare fallback failed:', e);
    }
  }

  throw new Error('All AI providers failed. Please check your API keys.');
}

// ─── Text Generation ────────────────────────────────────────────────────────────

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  model?: string
): Promise<string> {
  const selectedModel = model || DEFAULT_MODELS.writer;
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  return chatWithFallback(messages, selectedModel);
}

export async function generateTextWithContext(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model?: string
): Promise<string> {
  const selectedModel = model || DEFAULT_MODELS.chat;
  return chatWithFallback(messages, selectedModel);
}

export async function generateWithReasoning(
  systemPrompt: string,
  userPrompt: string,
  model?: string
): Promise<{ content: string; reasoning?: string }> {
  const selectedModel = model || DEFAULT_MODELS.reasoning;
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Think step by step before answering.\n\n' + userPrompt },
  ];
  const content = await chatWithFallback(messages, selectedModel);
  return { content, reasoning: undefined };
}

// ─── Image Generation ───────────────────────────────────────────────────────────

async function nvidiaImageGenerate(
  prompt: string,
  options?: { negativePrompt?: string; steps?: number; seed?: number }
): Promise<{ data: string; url?: string }> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY not configured');

  const textPrompts: Array<{ text: string; weight: number }> = [
    { text: prompt, weight: 1 },
  ];
  if (options?.negativePrompt) {
    textPrompts.push({ text: options.negativePrompt, weight: -1 });
  }

  const response = await fetch(`${NVIDIA_IMAGE_BASE_URL}/stabilityai/stable-diffusion-xl`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      text_prompts: textPrompts,
      height: 1024,
      width: 1024,
      cfg_scale: 5,
      sampler: 'K_DPM_2_ANCESTRAL',
      steps: options?.steps ?? 25,
      seed: options?.seed ?? 0,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA Image API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as {
    artifacts?: Array<{ base64: string; finishReason?: string }>;
  };

  const artifact = data.artifacts?.[0];
  if (artifact?.base64) {
    return { data: artifact.base64 };
  }

  throw new Error('No image data in NVIDIA response');
}

async function cloudflareImageGenerate(
  prompt: string,
  model?: string
): Promise<{ data: string; url?: string }> {
  const apiKey = process.env.CLOUDFLARE_API_KEY;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!apiKey || !accountId) throw new Error('Cloudflare credentials not configured');

  const cfModel = model || '@cf/black-forest-labs/flux-1-schnell';
  const url = `${getCloudflareBaseUrl()}/${cfModel}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      num_steps: 4,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare Image API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as {
    result?: { image?: string };
  };

  if (data.result?.image) {
    return { data: data.result.image };
  }

  throw new Error('No image data in Cloudflare response');
}

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
  const model = options?.model || DEFAULT_MODELS.image;
  const provider = detectProvider(model);

  // Try primary provider
  try {
    if (provider === 'cloudflare' || model.startsWith('@cf/')) {
      return await cloudflareImageGenerate(prompt, model);
    }
    // NVIDIA image generation
    return await nvidiaImageGenerate(prompt, {
      negativePrompt: options?.negativePrompt,
    });
  } catch (primaryError) {
    console.error(`Primary image provider (${provider}) failed:`, primaryError);
  }

  // Fallback: Cloudflare FLUX.1 Schnell (fast, reliable)
  if (provider !== 'cloudflare') {
    try {
      return await cloudflareImageGenerate(prompt, '@cf/black-forest-labs/flux-1-schnell');
    } catch (cfError) {
      console.error('Cloudflare image fallback failed:', cfError);
    }
  }

  // Fallback: NVIDIA SDXL
  if (provider !== 'nvidia') {
    try {
      return await nvidiaImageGenerate(prompt, {
        negativePrompt: options?.negativePrompt,
      });
    } catch (nvidiaError) {
      console.error('NVIDIA image fallback failed:', nvidiaError);
    }
  }

  throw new Error('All image generation providers failed. Please check your API keys.');
}

// ─── Speech-to-Text (Transcription) ─────────────────────────────────────────────

export async function transcribeAudio(
  audioBase64: string,
  language?: string
): Promise<string> {
  // Try Cloudflare Whisper
  const apiKey = process.env.CLOUDFLARE_API_KEY;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (apiKey && accountId) {
    try {
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      const url = `${getCloudflareBaseUrl()}/@cf/openai/whisper`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream',
        },
        body: audioBuffer,
      });

      if (response.ok) {
        const data = await response.json() as {
          result?: { text?: string };
        };
        if (data.result?.text) {
          return data.result.text;
        }
      }
    } catch (e) {
      console.error('Cloudflare Whisper failed:', e);
    }
  }

  // Fallback: Bytez whisper model
  const bytezKey = process.env.BYTEZ_API_KEY;
  if (bytezKey) {
    try {
      const response = await fetch(`${BYTEZ_BASE_URL}/openai/whisper-large-v3`, {
        method: 'POST',
        headers: {
          'Authorization': bytezKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64: audioBase64,
          params: { language: language || 'en' },
        }),
      });

      if (response.ok) {
        const data = await response.json() as {
          output?: string | { text?: string };
        };
        if (typeof data.output === 'string') return data.output;
        if (typeof data.output === 'object' && data.output?.text) return data.output.text;
      }
    } catch (e) {
      console.error('Bytez Whisper failed:', e);
    }
  }

  throw new Error('Transcription failed. No available STT provider.');
}

// ─── Text-to-Speech ─────────────────────────────────────────────────────────────

export async function textToSpeech(
  text: string,
  options?: {
    voice?: string;
    language?: string;
    speed?: number;
  }
): Promise<{ audioData: string; url?: string }> {
  // Try Bytez TTS model
  const bytezKey = process.env.BYTEZ_API_KEY;
  if (bytezKey) {
    try {
      const response = await fetch(`${BYTEZ_BASE_URL}/facebook/mms-tts-eng`, {
        method: 'POST',
        headers: {
          'Authorization': bytezKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          params: {
            language: options?.language || 'en',
          },
        }),
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';

        // If the response is audio binary
        if (contentType.includes('audio') || contentType.includes('octet-stream')) {
          const arrayBuffer = await response.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          return { audioData: base64 };
        }

        // If JSON response with audio data
        const data = await response.json() as {
          output?: string;
          audio?: string;
          data?: string;
        };
        const audioContent = data.output || data.audio || data.data;
        if (audioContent) {
          return { audioData: typeof audioContent === 'string' ? audioContent : JSON.stringify(audioContent) };
        }
      }
    } catch (e) {
      console.error('Bytez TTS failed:', e);
    }
  }

  // Fallback: Use NVIDIA NIM for TTS if available
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey) {
    try {
      // NVIDIA Riva TTS endpoint
      const response = await fetch(`${NVIDIA_BASE_URL}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${nvidiaKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'nvidia/fastpitch-hifigan-tts',
          input: text,
          voice: options?.voice || 'alloy',
          response_format: 'mp3',
          speed: options?.speed || 1.0,
        }),
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return { audioData: base64 };
      }
    } catch (e) {
      console.error('NVIDIA TTS failed:', e);
    }
  }

  throw new Error('Text-to-speech failed. No available TTS provider.');
}
