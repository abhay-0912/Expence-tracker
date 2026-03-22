import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT } from "../constants.js";
import { parseJsonResponse } from "../parseJsonResponse.js";

export function createGeminiProvider({
  apiKey = process.env.GEMINI_API_KEY,
  model = "gemini-3-flash-preview",
} = {}) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required for gemini provider");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelClient = genAI.getGenerativeModel({ model });

  return {
    async parseExpenseFromText(text) {
      try {
        const prompt = [
          SYSTEM_PROMPT,
          "",
          `Parse this expense message: \"${text}\"`,
        ].join("\n");

        const res = await modelClient.generateContent(prompt);
        const outputText = res.response?.text?.() || "";
        return parseJsonResponse(outputText);
      } catch (err) {
        console.error("Gemini text parse error:", err.message);
        return null;
      }
    },

    async parseExpenseFromImage(imageBuffer, mimeType = "image/jpeg") {
      try {
        const res = await modelClient.generateContent([
          {
            text: [
              SYSTEM_PROMPT,
              "",
              "This is a bill or receipt. Find the final total amount paid, choose the best category, and write a short description.",
            ].join("\n"),
          },
          {
            inlineData: {
              data: imageBuffer.toString("base64"),
              mimeType,
            },
          },
        ]);

        const outputText = res.response?.text?.() || "";
        return parseJsonResponse(outputText);
      } catch (err) {
        console.error("Gemini image parse error:", err.message);
        return null;
      }
    },
  };
}
