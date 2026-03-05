-- Users table (run in Supabase SQL Editor first if not already created)
-- Required for auth: /auth/user/register and /auth/user/login

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'restaurant', 'rider')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: allow backend to insert (if using anon key with RLS)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow insert for anon" ON users FOR INSERT WITH CHECK (true);
-- Or use the service_role key in the backend instead of anon key for full access.
