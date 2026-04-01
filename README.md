# AI Escape Pod — Cloud (xAI API + Vercel)

Private Grok-style AI chat. Deploy once to Vercel. Runs forever.

## 5-Minute Setup

### 1. Get xAI API Key
→ [console.x.ai](https://console.x.ai) → API Keys → Create → Copy

### 2. Run Locally
```bash
npm install
cp .env.example .env.local
# Edit .env.local: set XAI_API_KEY=xai-...
npm run dev
# → http://localhost:3000
```

### 3. Deploy to Vercel
```bash
npx vercel --prod
# Set XAI_API_KEY in: Vercel Dashboard → Settings → Environment Variables
```

## Config Reference

| Variable | Required | Default | Notes |
|---|---|---|---|
| `XAI_API_KEY` | ✅ | — | From console.x.ai |
| `AI_MODEL` | No | `grok-beta` | See xAI model list |
| `SYSTEM_PROMPT` | No | Generic | Custom AI persona |
| `NEXT_PUBLIC_APP_NAME` | No | `AI Escape Pod` | UI branding |
| `API_BASE_URL` | No | xAI default | Swap to OpenAI/Anthropic/Ollama |

## Swap Providers (any OpenAI-compatible API)
```env
# OpenAI
XAI_API_KEY=sk-your-openai-key
API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o

# Local Ollama
XAI_API_KEY=none
API_BASE_URL=http://localhost:11434/v1
AI_MODEL=deepseek-r1:8b
```
