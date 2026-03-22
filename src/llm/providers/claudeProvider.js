import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "../constants.js";

export function createClaudeProvider({ apiKey = process.env.ANTHROPIC_API_KEY } = {}) {
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required for claude provider");
  }

  const client = new Anthropic({ apiKey });

  return {
    async parseExpenseFromText(text) {
      try {
        const res = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 256,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Parse this expense message: \"${text}\"` }],
        });

        return JSON.parse(res.content[0].text.trim());
      } catch (err) {
        console.error("Claude text parse error:", err.message);
        return null;
      }
    },

    async parseExpenseFromImage(imageBuffer, mimeType = "image/jpeg") {
      try {
        const base64 = imageBuffer.toString("base64");

        const res = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 512,
          system: SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mimeType, data: base64 },
              },
              {
                type: "text",
                text: "This is a bill or receipt. Find the final total amount paid, choose the best category, and write a short description.",
              },
            ],
          }],
        });

        return JSON.parse(res.content[0].text.trim());
      } catch (err) {
        console.error("Claude image parse error:", err.message);
        return null;
      }
    },
  };
}
