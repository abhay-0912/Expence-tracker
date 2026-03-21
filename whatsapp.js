import { parseExpenseFromText, parseExpenseFromImage } from "./claude.js";
import {
  saveExpense,
  getSummary,
  getMonthlyReport,
  deleteLastExpense,
} from "./supabase.js";
import { sendMessage, downloadMedia } from "./twilioApi.js";

const COMMANDS = {
  SUMMARY: ["summary", "total", "totals", "how much", "spent"],
  REPORT:  ["report", "monthly report", "this month"],
  HELP:    ["help", "commands", "hi", "hello", "start"],
  DELETE:  ["delete last", "undo", "remove last"],
};

function matchCommand(text) {
  const lower = text.toLowerCase();
  for (const [cmd, triggers] of Object.entries(COMMANDS)) {
    if (triggers.some((t) => lower.includes(t))) return cmd;
  }
  return null;
}

export async function handleIncomingMessage({ from, body, mediaUrl, mediaType }) {
  try {
    // ── Image / bill photo ─────────────────────────────────────────
    if (mediaUrl && mediaType?.startsWith("image/")) {
      await sendMessage(from, "📸 Got your bill! Analyzing it...");

      const imageBuffer = await downloadMedia(mediaUrl);
      const expense = await parseExpenseFromImage(imageBuffer, mediaType);

      if (!expense?.amount) {
        return sendMessage(
          from,
          "😕 Couldn't read the bill clearly. Try a clearer photo, or type the amount manually (e.g. *food 350*)."
        );
      }

      await saveExpense(from, expense);
      return sendMessage(from, confirmationMessage(expense));
    }

    // ── Text message ───────────────────────────────────────────────
    if (!body) return; // empty message, ignore

    const command = matchCommand(body);

    if (command === "HELP")    return sendMessage(from, helpMessage());
    if (command === "SUMMARY") return sendMessage(from, formatSummary(await getSummary(from)));
    if (command === "REPORT")  return sendMessage(from, formatReport(await getMonthlyReport(from)));

    if (command === "DELETE") {
      const deleted = await deleteLastExpense(from);
      return sendMessage(
        from,
        deleted
          ? `✅ Deleted: *${deleted.description || deleted.category}* — ₹${deleted.amount}`
          : "No recent expense found to delete."
      );
    }

    // Try to parse as an expense
    const expense = await parseExpenseFromText(body);

    if (!expense?.amount) {
      return sendMessage(
        from,
        "❓ Couldn't detect an expense. Try:\n• *food ₹200*\n• *uber 150*\n• *groceries 800*\n\nOr type *help* to see all commands."
      );
    }

    await saveExpense(from, expense);
    return sendMessage(from, confirmationMessage(expense));

  } catch (err) {
    console.error("handleIncomingMessage error:", err);
    await sendMessage(from, "⚠️ Something went wrong. Please try again in a moment.");
  }
}

// ── Message formatters ───────────────────────────────────────────────────────

function confirmationMessage({ category, amount, description }) {
  return (
    `✅ *Saved!*\n\n` +
    `${categoryEmoji(category)} *Category:* ${category}\n` +
    `💰 *Amount:* ₹${amount}\n` +
    `📝 *Note:* ${description || "—"}\n\n` +
    `Type *summary* to see your totals.`
  );
}

function formatSummary(rows) {
  if (!rows?.length) return "No expenses recorded this month yet!";

  const total = rows.reduce((s, r) => s + Number(r.total), 0);
  let msg = `📊 *This Month's Spending*\n\n`;

  for (const row of rows) {
    msg += `${categoryEmoji(row.category)} ${row.category}: ₹${Number(row.total).toLocaleString("en-IN")}\n`;
  }

  msg += `\n💸 *Total: ₹${total.toLocaleString("en-IN")}*`;
  return msg;
}

function formatReport(rows) {
  if (!rows?.length) return "No expenses found for this month.";

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  let msg = `📋 *Monthly Report*\n`;
  let lastCat = null;

  for (const row of rows) {
    if (row.category !== lastCat) {
      msg += `\n*${categoryEmoji(row.category)} ${row.category}*\n`;
      lastCat = row.category;
    }
    const date = new Date(row.created_at).toLocaleDateString("en-IN", {
      day: "numeric", month: "short",
    });
    msg += `  • ${date} — ₹${row.amount}${row.description ? ` (${row.description})` : ""}\n`;
  }

  msg += `\n💸 *Grand Total: ₹${total.toLocaleString("en-IN")}*`;
  return msg;
}

function helpMessage() {
  return (
    `👋 *Expense Tracker — Commands*\n\n` +
    `📌 *Log an expense:*\n` +
    `  • _food ₹200_\n` +
    `  • _paid 500 for uber_\n` +
    `  • Send a photo of a bill\n\n` +
    `📊 *View spending:*\n` +
    `  • _summary_ — totals by category\n` +
    `  • _report_ — every expense this month\n\n` +
    `🗑 *Other:*\n` +
    `  • _delete last_ — undo last entry\n` +
    `  • _help_ — show this message`
  );
}

function categoryEmoji(cat) {
  return {
    Food: "🍔", Groceries: "🛒", Transport: "🚗", Shopping: "🛍",
    Health: "💊", Entertainment: "🎬", Utilities: "⚡", Rent: "🏠",
    Education: "📚", Travel: "✈️", Other: "📌",
  }[cat] || "📌";
}
