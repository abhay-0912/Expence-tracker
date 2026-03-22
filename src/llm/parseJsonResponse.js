export function parseJsonResponse(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return null;
  }

  const trimmed = rawText.trim();
  const noFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = noFence.indexOf("{");
  const end = noFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    return null;
  }

  try {
    return JSON.parse(noFence.slice(start, end + 1));
  } catch {
    return null;
  }
}
