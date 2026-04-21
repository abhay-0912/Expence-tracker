import express from "express";
import { handleIncomingMessage } from "./whatsapp.js";
import { buildDashboardHtml } from "./dashboard/index.js";

const app = express();

// Twilio sends form-encoded POST bodies
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Dashboard / health landing page
app.get("/", (req, res) => {
  res.status(200).type("html").send(buildDashboardHtml());
});

app.get("/health", (req, res) => res.send("Expense Tracker Bot is running ✅"));

// Twilio webhook — fires on every incoming WhatsApp message
app.post("/webhook", async (req, res) => {
  try {
    const from = req.body.From;
    const body = req.body.Body?.trim() || "";
    const numMedia = parseInt(req.body.NumMedia || "0", 10);
    const mediaUrl = numMedia > 0 ? req.body.MediaUrl0 : null;
    const mediaType = numMedia > 0 ? req.body.MediaContentType0 : null;

    await handleIncomingMessage({ from, body, mediaUrl, mediaType });

    // Twilio expects an empty 200 — replies are sent via REST API, not TwiML
    res.status(200).send("<Response></Response>");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(200).send("<Response></Response>");
  }
});

export default app;