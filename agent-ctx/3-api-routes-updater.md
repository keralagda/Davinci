# Task 3: API Routes Update — NVIDIA Models & Real TTS/STT

## Agent: api-routes-updater
## Date: 2025-01-02

### Summary
Updated all 6 API routes to use NVIDIA model references instead of OpenAI, and replaced mock TTS/STT implementations with real AI-powered transcription and speech synthesis.

### Files Modified

1. **`/src/app/api/generate/text/route.ts`**
   - Imported `DEFAULT_MODELS` from `@/lib/ai-helpers`
   - Changed default model from `'default'` to `DEFAULT_MODELS.writer` (→ `nvidia/llama-3.1-nemotron-70b-instruct`)
   - Now stores actual NVIDIA model name in the database `model` field instead of `'default'`
   - Added `model` field to the JSON response so frontend knows which model was used

2. **`/src/app/api/generate/code/route.ts`**
   - Imported `DEFAULT_MODELS` from `@/lib/ai-helpers`
   - Changed default model from `'default'` to `DEFAULT_MODELS.code` (→ `nvidia/llama-3.1-nemotron-70b-instruct`)
   - Now stores actual NVIDIA model name in database
   - Added `model` field to the JSON response

3. **`/src/app/api/generate/image/route.ts`**
   - Imported `DEFAULT_MODELS` from `@/lib/ai-helpers`
   - Added `model` parameter extraction from request body
   - Changed default model to `DEFAULT_MODELS.image` (→ `stabilityai/stable-diffusion-xl`)
   - Passes `model` and `negativePrompt` to `generateImage()` options
   - Added `model` and `style` fields to the JSON response

4. **`/src/app/api/chat/route.ts`**
   - Replaced direct `z-ai-web-dev-sdk` import with `generateTextWithContext` helper from `@/lib/ai-helpers`
   - Added `model` parameter extraction from request body
   - Changed default model to `DEFAULT_MODELS.chat` (→ `nvidia/llama-3.1-nemotron-70b-instruct`)
   - Uses `generateTextWithContext(aiMessages, selectedModel)` instead of raw SDK call
   - Added `model` field to the JSON response

5. **`/src/app/api/tts/route.ts`** — **Full replacement of mock**
   - Removed mock implementation (simulated delay + fake response)
   - Now calls `textToSpeech()` from `@/lib/ai-helpers` for real AI-powered speech synthesis
   - Handles both URL and base64 audioData responses from the helper
   - Returns `audioUrl` (data URL or remote URL), `duration`, `fileSize`, `voice`, `language`, `speed`, `format`
   - Frontend-compatible: supports both audio blob responses and JSON with `audioUrl`
   - Estimates file size from base64 length when base64 audio is returned

6. **`/src/app/api/transcribe/route.ts`** — **Full replacement of mock**
   - Removed mock implementation (hardcoded text + fake segments)
   - Now converts uploaded file to base64 and calls `transcribeAudio()` from `@/lib/ai-helpers`
   - Returns real transcribed text with detected language, estimated duration, and sentence-based segments
   - Added `detectLanguageFromText()` helper — detects CJK, Cyrillic, Arabic, Devanagari, or defaults to English
   - Added `buildSegments()` helper — splits transcription into sentences with proportionally distributed timestamps
   - Maintains the same response format expected by the frontend: `{ text, language, duration, segments: [{ start, end, text }] }`

### Key Design Decisions

- **Model defaults**: All routes use `DEFAULT_MODELS` from `ai-helpers.ts` for consistent default model selection across the app
- **Frontend compatibility**: All response formats remain compatible with existing frontend components — no frontend changes required
- **TTS response format**: Returns JSON with `audioUrl` (either a remote URL or base64 data URL) since the frontend already handles both cases
- **Transcription segments**: Real AI transcription doesn't include timestamps, so segments are built by sentence-splitting with proportionally distributed timestamps based on character count
- **Error handling**: All routes maintain proper error handling with appropriate HTTP status codes

### Verification
- `bun run lint` — passed with zero errors
- Dev server compiles all routes successfully (confirmed via dev.log)
