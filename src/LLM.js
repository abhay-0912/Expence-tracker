import { getLLMProviderNameFromEnv } from "./llm/config.js";
import { createLLMProvider, createLLMProviderWithFallback } from "./llm/providerRegistry.js";

let activeProvider = null;

export function createLLMProviderFromConfig(env = process.env, withFallback = true) {
	const providerName = getLLMProviderNameFromEnv(env);
	const options = {
		apiKey:
			providerName === "openai"
				? env.OPENAI_API_KEY
				: providerName === "gemini"
					? env.GEMINI_API_KEY
					: env.ANTHROPIC_API_KEY,
		model:
			providerName === "openai"
				? env.OPENAI_MODEL
				: providerName === "gemini"
					? env.GEMINI_MODEL
					: env.ANTHROPIC_MODEL,
	};

	if (withFallback) {
		return createLLMProviderWithFallback(providerName, options);
	}
	return createLLMProvider(providerName, options);
}

export function getLLMProvider() {
	if (!activeProvider) {
		activeProvider = createLLMProviderFromConfig();
	}

	return activeProvider;
}

export function setLLMProviderForTests(provider) {
	activeProvider = provider;
}

export async function parseExpenseFromText(text) {
	return getLLMProvider().parseExpenseFromText(text);
}

export async function parseExpenseFromImage(imageBuffer, mimeType = "image/jpeg") {
	return getLLMProvider().parseExpenseFromImage(imageBuffer, mimeType);
}
