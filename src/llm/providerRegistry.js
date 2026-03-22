import { createClaudeProvider } from "./providers/claudeProvider.js";
import { createOpenAIProvider } from "./providers/openAIProvider.js";
import { createGeminiProvider } from "./providers/geminiProvider.js";

const providerFactories = {
  claude: createClaudeProvider,
  openai: createOpenAIProvider,
  gemini: createGeminiProvider,
};

const fallbackChain = {
  claude: ["gemini", "openai"],    // Claude → Gemini → OpenAI
  openai: ["gemini", "claude"],    // OpenAI → Gemini → Claude
  gemini: ["claude", "openai"],    // Gemini → Claude → OpenAI
};

export function createLLMProvider(providerName, options = {}) {
  const normalizedProvider = (providerName || "").toLowerCase();
  const factory = providerFactories[normalizedProvider];

  if (!factory) {
    const available = Object.keys(providerFactories).join(", ");
    throw new Error(`Unsupported LLM provider: ${providerName}. Available providers: ${available}`);
  }

  return factory(options);
}

export function createLLMProviderWithFallback(primaryProvider, options = {}) {
  let provider = null;
  let lastError = null;

  // Try primary provider
  try {
    provider = createLLMProvider(primaryProvider, options);
    console.log(`✓ Loaded LLM provider: ${primaryProvider}`);
    return provider;
  } catch (err) {
    lastError = err;
    console.warn(`⚠ Failed to load ${primaryProvider}:`, err.message);
  }

  // Try fallback providers in order
  const fallbacks = fallbackChain[primaryProvider] || [];
  for (const fallback of fallbacks) {
    try {
      provider = createLLMProvider(fallback, options);
      console.log(`✓ Fallback to LLM provider: ${fallback}`);
      return provider;
    } catch (err) {
      console.warn(`⚠ Fallback ${fallback} failed:`, err.message);
    }
  }

  // All providers failed
  throw new Error(
    `Failed to load any LLM provider. Primary: ${primaryProvider}. ` +
    `Last error: ${lastError?.message}`
  );
}

export function getAvailableProviders() {
  return Object.keys(providerFactories);
}
