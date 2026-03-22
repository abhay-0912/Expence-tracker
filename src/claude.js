import { createClaudeProvider } from "./llm/providers/claudeProvider.js";

const provider = createClaudeProvider();

export async function parseExpenseFromText(text) {
  return provider.parseExpenseFromText(text);
}

export async function parseExpenseFromImage(imageBuffer, mimeType = "image/jpeg") {
  return provider.parseExpenseFromImage(imageBuffer, mimeType);
}
