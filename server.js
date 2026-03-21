import express from "express";
import { handleIncomingMessage } from "./whatsapp.js";
import { startCronJobs } from "./cron.js";

const app = express();

// Twilio sends form-encoded POST bodies
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Health check
app.get("/", (req, res) => res.send("Expense Tracker Bot is running ✅"));

// Twilio webhook — fires on every incoming WhatsApp message
app.post("/webhook", async (req, res) => {
  try {
    const from    = req.body.From;   // e.g. "whatsapp:+919876543210"
    const body    = req.body.Body?.trim() || "";
    const numMedia = parseInt(req.body.NumMedia || "0", 10);
    const mediaUrl = numMedia > 0 ? req.body.MediaUrl0 : null;
    const mediaType = numMedia > 0 ? req.body.MediaContentType0 : null;

    await handleIncomingMessage({ from, body, mediaUrl, mediaType });

    // Twilio expects an empty 200 — we send replies via REST API, not TwiML
    res.status(200).send("<Response></Response>");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(200).send("<Response></Response>"); // always 200 to Twilio
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startCronJobs();
});
