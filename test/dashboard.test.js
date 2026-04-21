import test from "node:test";
import assert from "node:assert/strict";

import { getDashboardData } from "../src/dashboard/dashboardData.js";
import { buildDashboardHtml } from "../src/dashboard/index.js";

test("dashboard data maps environment values", () => {
  const data = getDashboardData({
    TWILIO_WHATSAPP_NUMBER: "whatsapp:+14155238886",
    TWILIO_SANDBOX_JOIN_CODE: "join expense-bot",
    LLM_PROVIDER: "gemini",
  });

  assert.equal(data.twilioNumber, "whatsapp:+14155238886");
  assert.equal(data.sandboxJoinCode, "expense-bot");
  assert.equal(data.provider, "gemini");
});

test("dashboard html includes Twilio and sandbox instructions", () => {
  const html = buildDashboardHtml({
    TWILIO_WHATSAPP_NUMBER: "whatsapp:+14155238886",
    TWILIO_SANDBOX_JOIN_CODE: "join expense-bot",
    LLM_PROVIDER: "gemini",
  });

  assert.match(html, /whatsapp:\+14155238886/);
  assert.match(html, /join expense-bot/);
  assert.match(html, /Setup checklist/);
  assert.match(html, /Quick reference/);
  assert.match(html, /Copy sandbox join code/);
});