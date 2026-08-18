/*
# Prestoeat Operations Dispatcher — initial schema

1. Overview
   Single-tenant demo app with a custom (simulated OTP) auth flow that stores
   sessions in localStorage. The Supabase client uses the anon key, so all
   policies are scoped to `anon, authenticated` and the data is intentionally
   shared across the demo session.

2. New Tables
   - `employees`: staff directory (name, email, role, online status, last active).
   - `audit_logs`: security activity trail (promotions, demotions, edits, deletes).
   - `dev_tickets`: developer feedback / bug reports submitted by users.
   - `chat_messages`: AI dispatch agent conversation history per user email.

3. Security
   - RLS enabled on every table.
   - CRUD policies for `anon, authenticated` (intentionally shared demo data).
*/

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('employee','supervisor','admin')),
  online boolean NOT NULL DEFAULT false,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_employees" ON employees;
CREATE POLICY "anon_select_employees" ON employees FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_employees" ON employees;
CREATE POLICY "anon_insert_employees" ON employees FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_employees" ON employees;
CREATE POLICY "anon_update_employees" ON employees FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_employees" ON employees;
CREATE POLICY "anon_delete_employees" ON employees FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  actor_email text NOT NULL,
  target_email text,
  details text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_audit_logs" ON audit_logs;
CREATE POLICY "anon_select_audit_logs" ON audit_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_audit_logs" ON audit_logs;
CREATE POLICY "anon_insert_audit_logs" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS dev_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  user_name text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dev_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_dev_tickets" ON dev_tickets;
CREATE POLICY "anon_select_dev_tickets" ON dev_tickets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_dev_tickets" ON dev_tickets;
CREATE POLICY "anon_insert_dev_tickets" ON dev_tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_dev_tickets" ON dev_tickets;
CREATE POLICY "anon_update_dev_tickets" ON dev_tickets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_chat_messages" ON chat_messages;
CREATE POLICY "anon_select_chat_messages" ON chat_messages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_chat_messages" ON chat_messages;
CREATE POLICY "anon_insert_chat_messages" ON chat_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_chat_messages" ON chat_messages;
CREATE POLICY "anon_delete_chat_messages" ON chat_messages FOR DELETE TO anon, authenticated USING (true);

-- Seed employees
INSERT INTO employees (name, email, role, online) VALUES
  ('ليث فرحات', 'l.farhat@prestoeat.com', 'admin', true),
  ('ليت فرحات', 'laitfarhat@gmail.com', 'supervisor', true),
ON CONFLICT (email) DO NOTHING;
