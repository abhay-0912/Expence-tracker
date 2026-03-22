# LLM Provider Plugin Architecture

## Overview
The expense tracker now supports **pluggable AI providers** with automatic fallback. Switch providers with a single config change without modifying code.

## Supported Providers

| Provider | Config Value | Env Key | Model Key | Status |
|----------|-------------|---------|-----------|--------|
| Claude (Anthropic) | `claude` | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL` | ✅ Supported |
| OpenAI (GPT) | `openai` | `OPENAI_API_KEY` | `OPENAI_MODEL` | ✅ Supported |
| Google Gemini | `gemini` | `GEMINI_API_KEY` | `GEMINI_MODEL` | ✅ Supported |

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (.env)
```env
# Choose your primary provider
LLM_PROVIDER=claude

# Add API keys for providers (minimum: one is required)
ANTHROPIC_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Optional: Specify model names (will use defaults if not set)
ANTHROPIC_MODEL=claude-sonnet-4-20250514
OPENAI_MODEL=gpt-4o-mini
GEMINI_MODEL=gemini-3-flash-preview
```

### 3. Run the Server
```bash
npm start    # Production
npm run dev  # Development with watch mode
```

## Switching Providers

### Option A: Change Environment Variable
```bash
# Use OpenAI
LLM_PROVIDER=openai npm start

# Use Gemini
LLM_PROVIDER=gemini npm start
```

### Option B: Edit `.env` File
```env
LLM_PROVIDER=openai
```

Then restart the server.

## Automatic Fallback Chain

If your primary provider fails (API error, missing key, etc.), the system automatically tries:

- **Claude Primary**: `Claude → Gemini → OpenAI`
- **OpenAI Primary**: `OpenAI → Gemini → Claude`
- **Gemini Primary**: `Gemini → Claude → OpenAI`

Logs will show which provider is active:
```
✓ Loaded LLM provider: claude
⚠ Failed to load claude: ANTHROPIC_API_KEY is required
✓ Fallback to LLM provider: gemini
```

## Module Structure

```
src/
├── LLM.js                          # Main facade with config loading
├── llm/
│   ├── config.js                   # Config loader (LLM_PROVIDER env)
│   ├── constants.js                # System prompt (shared)
│   ├── parseJsonResponse.js        # JSON extraction utility
│   ├── providerRegistry.js         # Provider factory & fallback logic
│   └── providers/
│       ├── claudeProvider.js       # Anthropic Claude implementation
│       ├── openAIProvider.js       # OpenAI GPT implementation
│       └── geminiProvider.js       # Google Gemini implementation
├── whatsapp.js                     # Handler with DI support
└── server.js                       # Express server
```

## API Interfaces

All providers implement the same interface:

```javascript
{
  parseExpenseFromText(text: string): Promise<Expense | null>,
  parseExpenseFromImage(buffer: Buffer, mimeType: string): Promise<Expense | null>
}
```

## Testing

Providers are dependency-injected for easy unit testing:

```javascript
import { createWhatsAppHandler } from './whatsapp.js';

const mockLLM = {
  parseExpenseFromText: async (text) => ({
    amount: 250,
    category: 'Food',
    description: 'lunch',
  }),
  parseExpenseFromImage: async () => null,
};

const handler = createWhatsAppHandler({ llm: mockLLM });
await handler({ from: '+1234567890', body: 'food 250' });
```

## Adding a New Provider

1. Create `src/llm/providers/yourProvider.js`:
   ```javascript
   export function createYourProvider({ apiKey, model } = {}) {
     return {
       async parseExpenseFromText(text) { /* ... */ },
       async parseExpenseFromImage(buffer, mimeType) { /* ... */ },
     };
   }
   ```

2. Register in `src/llm/providerRegistry.js`:
   ```javascript
   import { createYourProvider } from "./providers/yourProvider.js";
   
   const providerFactories = {
     // ...
     yourprovider: createYourProvider,
   };
   ```

3. Add environment variables to `.env.example`

4. Update fallback chain if desired

## Troubleshooting

### Provider fails to initialize
- Check that the corresponding API key is set in `.env`
- Verify the API key is valid and has correct permissions
- Check console logs for specific error message

### Wrong provider is being used
- Verify `LLM_PROVIDER` environment variable: `echo $LLM_PROVIDER`
- Make sure `.env` file is in the project root

### Missing module error
- Run `npm install` to ensure all SDK dependencies are installed
- Check Node.js version (requires 18+)

## Costs & Performance

| Provider | Cost | Speed | Image Support |
|----------|------|-------|---|
| Claude | Medium | Fast | ✅ Yes |
| OpenAI | Low | Fast | ✅ Yes |
| Gemini | Very Low | Medium | ✅ Yes |

## Environment Variables Cheat Sheet

```env
# Required: at least one provider's API key

# Claude
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# Gemini
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-3-flash-preview

# Controls which provider to use
LLM_PROVIDER=claude  # or 'openai' or 'gemini'
```
