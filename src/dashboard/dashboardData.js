function normalizeSandboxJoinCode(value) {
  const raw = String(value || "").trim();
  if (!raw) return "drove-lamp";

  // Accept both "drove-lamp" and "join drove-lamp" from config.
  return raw.replace(/^join\s+/i, "").trim() || "drove-lamp";
}

export function getDashboardData(env = process.env) {
  return {
    appName: "Expense Tracker Bot",
    twilioNumber: env.TWILIO_WHATSAPP_NUMBER || "+14155238886",
    sandboxJoinCode: normalizeSandboxJoinCode(env.TWILIO_SANDBOX_JOIN_CODE),
    provider: env.LLM_PROVIDER || "gemini",
    providerLabels: {
      claude: "Claude",
      openai: "OpenAI",
      gemini: "Gemini",
    },
  };
}