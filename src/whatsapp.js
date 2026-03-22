import { parseExpenseFromText, parseExpenseFromImage } from "./LLM.js";
import {
  saveExpense,
  getSummary,
  getMonthlyReport,
  deleteLastExpense,
} from "./supabase.js";
import { sendMessage, downloadMedia } from "./twilioApi.js";

const COMMANDS = {
  SUMMARY: ["summary", "total", "totals", "how much", "spent"],
  REPORT: ["report", "monthly report", "this month"],
  HELP: ["help", "commands", "hi", "hello", "start"],
  DELETE: ["delete last", "undo", "remove last"],
};

function matchCommand(text) {
  const lower = text.toLowerCase();
  for (const [cmd, triggers] of Object.entries(COMMANDS)) {
    if (triggers.some((t) => lower.includes(t))) return cmd;
  }
  return null;
}

export function createWhatsAppHandler({ llm, expenseStore, messenger }) {
  const activeLLM = llm ?? {
    parseExpenseFromText,
    parseExpenseFromImage,
  };

  const activeExpenseStore = expenseStore ?? {
    saveExpense,
    getSummary,
    getMonthlyReport,
    deleteLastExpense,
  };

  const activeMessenger = messenger ?? {
    sendMessage,
    downloadMedia,
  };

  return async function handleIncomingMessage({ from, body, mediaUrl, mediaType }) {
    try {
      if (mediaUrl && mediaType?.startsWith("image/")) {
        await activeMessenger.sendMessage(from, "📸 Got your bill! Analyzing it...");

        const imageBuffer = await activeMessenger.downloadMedia(mediaUrl);
        const expense = await activeLLM.parseExpenseFromImage(imageBuffer, mediaType);

        if (!expense?.amount) {
          return activeMessenger.sendMessage(
            from,
            "😕 Couldn't read the bill clearly. Try a clearer photo, or type the amount manually (e.g. *food 350*)."
          );
        }

        await activeExpenseStore.saveExpense(from, expense);
        return activeMessenger.sendMessage(from, confirmationMessage(expense));
      }

      if (!body) return;

      const command = matchCommand(body);

      if (command === "HELP") return activeMessenger.sendMessage(from, helpMessage());

      if (command === "SUMMARY") {
        const summary = await activeExpenseStore.getSummary(from);
        return activeMessenger.sendMessage(from, formatSummary(summary));
      }

      if (command === "REPORT") {
        const report = await activeExpenseStore.getMonthlyReport(from);
        return activeMessenger.sendMessage(from, formatReport(report));
      }

      if (command === "DELETE") {
        const deleted = await activeExpenseStore.deleteLastExpense(from);
        return activeMessenger.sendMessage(
          from,
          deleted
            ? `✅ Deleted: *${deleted.description || deleted.category}* — ₹${deleted.amount}`
            : "No recent expense found to delete."
        );
      }

      const expense = await activeLLM.parseExpenseFromText(body);

      if (!expense?.amount) {
        return activeMessenger.sendMessage(
          from,
          "❓ Couldn't detect an expense. Try:\n• *food ₹200*\n• *uber 150*\n• *groceries 800*\n\nOr type *help* to see all commands."
        );
      }

      await activeExpenseStore.saveExpense(from, expense);
      return activeMessenger.sendMessage(from, confirmationMessage(expense));
    } catch (err) {
      console.error("handleIncomingMessage error:", err);
      await activeMessenger.sendMessage(from, "⚠️ Something went wrong. Please try again in a moment.");
    }
  };
}

export const handleIncomingMessage = createWhatsAppHandler({});

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

  const total = rows.reduce((sum, row) => sum + Number(row.total), 0);
  let msg = `📊 *This Month's Spending*\n\n`;

  for (const row of rows) {
    msg += `${categoryEmoji(row.category)} ${row.category}: ₹${Number(row.total).toLocaleString("en-IN")}\n`;
  }

  msg += `\n💸 *Total: ₹${total.toLocaleString("en-IN")}*`;
  return msg;
}

function formatReport(rows) {
  if (!rows?.length) return "No expenses found for this month.";

  const total = rows.reduce((sum, row) => sum + Number(row.amount), 0);
  let msg = `📋 *Monthly Report*\n`;
  let lastCat = null;

  for (const row of rows) {
    if (row.category !== lastCat) {
      msg += `\n*${categoryEmoji(row.category)} ${row.category}*\n`;
      lastCat = row.category;
    }

    const date = new Date(row.created_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
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
    Food: "🍔",
    Groceries: "🛒",
    Transport: "🚗",
    Shopping: "🛍",
    Health: "💊",
    Entertainment: "🎬",
    Utilities: "⚡",
    Rent: "🏠",
    Education: "📚",
    Travel: "✈️",
    Other: "📌",
  }[cat] || "📌";
}
