import OpenAI from "openai";
import { SYSTEM_PROMPT } from "../constants.js";
import { parseJsonResponse } from "../parseJsonResponse.js";

export function createOpenAIProvider({
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_MODEL || "gpt-4o-mini",
} = {}) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for openai provider");
  }

  const client = new OpenAI({ apiKey });

  return {
    async parseExpenseFromText(text) {
      try {
        const res = await client.chat.completions.create({
          model,
          temperature: 0,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Parse this expense message: \"${text}\"` },
          ],
        });

        const outputText = res.choices?.[0]?.message?.content || "";
        return parseJsonResponse(outputText);
      } catch (err) {
        console.error("OpenAI text parse error:", err.message);
        return null;
      }
    },

    async parseExpenseFromImage(imageBuffer, mimeType = "image/jpeg") {
      try {
        const base64 = imageBuffer.toString("base64");
        const imageUrl = `data:${mimeType};base64,${base64}`;

        const res = await client.chat.completions.create({
          model,
          temperature: 0,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "This is a bill or receipt. Find the final total amount paid, choose the best category, and write a short description.",
                },
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
        });

        const outputText = res.choices?.[0]?.message?.content || "";
        return parseJsonResponse(outputText);
      } catch (err) {
        console.error("OpenAI image parse error:", err.message);
        return null;
      }
    },
  };
}
