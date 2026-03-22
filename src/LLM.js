import { getLLMProviderNameFromEnv } from "./llm/config.js";
import { createLLMProvider, createLLMProviderWithFallback, createProviderWithRuntimeFallback } from "./llm/providerRegistry.js";

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
		// Try to initialize primary provider; fallback to alternatives if init fails
		try {
			createLLMProviderWithFallback(providerName, options);
		} catch (err) {
			console.warn("Could not initialize any provider at startup");
		}
		// Return a provider wrapper that handles runtime failures too
		return createProviderWithRuntimeFallback(providerName, options);
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
