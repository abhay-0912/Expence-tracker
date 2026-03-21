-- ============================================
-- WhatsApp Expense Tracker — Supabase Schema
-- Paste this entire file into the SQL Editor
-- and click Run
-- ============================================

-- 1. Main expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL,          -- Twilio format: "whatsapp:+919876543210"
  amount      NUMERIC(10, 2) NOT NULL,
  category    TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast per-user and per-month queries
CREATE INDEX IF NOT EXISTS idx_expenses_phone      ON expenses (phone);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses (created_at);

-- 2. Monthly summary function (used by "summary" command)
CREATE OR REPLACE FUNCTION get_monthly_summary(p_phone TEXT)
RETURNS TABLE (category TEXT, total NUMERIC)
LANGUAGE sql AS $$
  SELECT
    category,
    SUM(amount) AS total
  FROM expenses
  WHERE
    phone = p_phone
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
  GROUP BY category
  ORDER BY total DESC;
$$;
