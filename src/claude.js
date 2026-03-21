import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expense parser for a personal finance tracker.
Extract expense details from user messages or bill/receipt images.

Always respond with ONLY valid JSON — no extra text, no markdown, no explanation:
{
  "amount": 250,
  "category": "Food",
  "description": "lunch at cafe"
}

Valid categories (pick the best fit):
Food, Groceries, Transport, Shopping, Health, Entertainment, Utilities, Rent, Education, Travel, Other

Rules:
- amount must be a plain number, no currency symbols
- If the message contains no clear expense, return { "amount": null }
- description must be 5 words or fewer
- category must be exactly one from the list above`;

export async function parseExpenseFromText(text) {
  try {
    const res = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Parse this expense message: "${text}"` }],
    });

    return JSON.parse(res.content[0].text.trim());
  } catch (err) {
    console.error("Claude text parse error:", err.message);
    return null;
  }
}

export async function parseExpenseFromImage(imageBuffer, mimeType = "image/jpeg") {
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
}
