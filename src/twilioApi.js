import twilio from "twilio";

let client = null;
let fromNumber = null;

function getTwilioClient() {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required");
    }

    client = twilio(accountSid, authToken);
  }

  return client;
}

function getFromNumber() {
  if (!fromNumber) {
    if (!process.env.TWILIO_WHATSAPP_NUMBER) {
      throw new Error("TWILIO_WHATSAPP_NUMBER is required");
    }

    fromNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
  }

  return fromNumber;
}

/** Send a WhatsApp text message via Twilio */
export async function sendMessage(to, text) {
  await getTwilioClient().messages.create({ from: getFromNumber(), to, body: text });
}

/**
 * Download a Twilio media file (bill photo) and return it as a Buffer.
 * Twilio protects media URLs with Basic Auth using your account credentials.
 */
export async function downloadMedia(mediaUrl) {
  const credentials = Buffer.from(
    `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
  ).toString("base64");

  const res = await fetch(mediaUrl, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!res.ok) throw new Error(`Failed to download media: ${res.status}`);

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
