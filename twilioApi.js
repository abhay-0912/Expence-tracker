import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

/** Send a WhatsApp text message via Twilio */
export async function sendMessage(to, text) {
  await client.messages.create({ from: FROM, to, body: text });
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
