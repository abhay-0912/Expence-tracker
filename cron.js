import cron from "node-cron";
import { getAllPhonesThisMonth, getMonthlyReport } from "./supabase.js";
import { sendMessage } from "./twilioApi.js";

export function startCronJobs() {
  // Runs at 9:00 AM every day on days 28–31
  // We check inside whether today is actually the last day of the month
  cron.schedule("0 9 28-31 * *", async () => {
    const now      = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    if (tomorrow.getDate() !== 1) return; // not the last day, skip

    const monthName = now.toLocaleString("default", { month: "long" });
    console.log(`Sending ${monthName} reports...`);

    const phones = await getAllPhonesThisMonth();

    for (const phone of phones) {
      try {
        const report = await getMonthlyReport(phone);
        const msg    = buildReportMessage(report, monthName);
        await sendMessage(phone, msg);
        console.log(`Report sent to ${phone}`);
      } catch (err) {
        console.error(`Failed to send report to ${phone}:`, err.message);
      }
    }
  });

  console.log("Monthly report cron job scheduled.");
}

function buildReportMessage(report, monthName) {
  if (!report?.length)
    return `📋 *${monthName} Report*\n\nNo expenses recorded this month!`;

  const totals = {};
  let grand = 0;

  for (const row of report) {
    totals[row.category] = (totals[row.category] || 0) + Number(row.amount);
    grand += Number(row.amount);
  }

  const emoji = (c) =>
    ({ Food:"🍔", Groceries:"🛒", Transport:"🚗", Shopping:"🛍", Health:"💊",
       Entertainment:"🎬", Utilities:"⚡", Rent:"🏠", Education:"📚", Travel:"✈️", Other:"📌" }[c] || "📌");

  let msg = `📋 *${monthName} Expense Report*\n\n*By Category:*\n`;

  for (const [cat, total] of Object.entries(totals)) {
    const pct = Math.round((total / grand) * 100);
    msg += `${emoji(cat)} ${cat}: ₹${total.toLocaleString("en-IN")} (${pct}%)\n`;
  }

  msg += `\n*All Transactions:*\n`;
  let lastCat = null;

  for (const row of report) {
    if (row.category !== lastCat) {
      msg += `\n_${row.category}_\n`;
      lastCat = row.category;
    }
    const date = new Date(row.created_at).toLocaleDateString("en-IN", {
      day: "numeric", month: "short",
    });
    msg += `  • ${date} — ₹${row.amount}${row.description ? ` (${row.description})` : ""}\n`;
  }

  msg += `\n💸 *Total: ₹${grand.toLocaleString("en-IN")}*\n`;
  msg += `\nHave a great ${new Date().toLocaleString("default", { month: "long" })}! 🎯`;
  return msg;
}
