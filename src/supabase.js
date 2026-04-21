import { createClient } from "@supabase/supabase-js";

let supabase = null;

function getSupabaseClient() {
  if (supabase) return supabase;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  supabase = createClient(supabaseUrl, serviceRoleKey);
  return supabase;
}

export async function saveExpense(phone, { amount, category, description }) {
  const { error } = await getSupabaseClient()
    .from("expenses")
    .insert({ phone, amount, category, description });

  if (error) throw new Error(`Supabase insert: ${error.message}`);
}

/** Totals per category for the current calendar month */
export async function getSummary(phone) {
  const { data, error } = await getSupabaseClient().rpc("get_monthly_summary", {
    p_phone: phone,
  });
  if (error) throw new Error(`Supabase summary: ${error.message}`);
  return data;
}

/** Every expense this month, sorted by category then date */
export async function getMonthlyReport(phone) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { data, error } = await getSupabaseClient()
    .from("expenses")
    .select("*")
    .eq("phone", phone)
    .gte("created_at", start)
    .lte("created_at", end)
    .order("category")
    .order("created_at");

  if (error) throw new Error(`Supabase report: ${error.message}`);
  return data;
}

/** Delete the most recent expense for this phone number */
export async function deleteLastExpense(phone) {
  const { data, error: findErr } = await getSupabaseClient()
    .from("expenses")
    .select("*")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1);

  if (findErr || !data?.length) return null;

  const row = data[0];
  const { error: delErr } = await getSupabaseClient().from("expenses").delete().eq("id", row.id);
  if (delErr) throw new Error(`Supabase delete: ${delErr.message}`);
  return row;
}

/** All distinct phone numbers that have expenses this month — used by cron */
export async function getAllPhonesThisMonth() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data, error } = await getSupabaseClient()
    .from("expenses")
    .select("phone")
    .gte("created_at", start);

  if (error) throw new Error(`Supabase phones: ${error.message}`);
  return [...new Set(data.map((r) => r.phone))];
}
