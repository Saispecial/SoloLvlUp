-- Temporarily disable email confirmation requirement
-- This allows users to sign up and use the app immediately
-- You can enable it later once SMTP is configured

-- Note: This is handled in Supabase Dashboard under:
-- Authentication > Settings > Email Auth > "Enable email confirmations" = OFF

-- For now, we'll update the signup flow to handle both scenarios gracefully
-- and allow immediate login after signup
