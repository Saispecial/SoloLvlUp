# Setting Up Resend SMTP for Email Verification

## Step 1: Create a Resend Account
1. Go to https://resend.com
2. Sign up for a free account
3. Verify your email

## Step 2: Get Your API Key
1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Copy your API key (starts with `re_`)
4. Keep this safe - you'll need it for Supabase

## Step 3: Configure Supabase SMTP Settings

### Via Supabase Dashboard:
1. Log into your Supabase project: https://app.supabase.com
2. Go to **Authentication** → **Email Provider**
3. Scroll down to **SMTP Settings**
4. Click **Enable Custom SMTP**
5. Fill in the following fields:

   | Field | Value |
   |-------|-------|
   | SMTP Host | `smtp.resend.com` |
   | SMTP Port | `465` |
   | SMTP Username | `resend` |
   | SMTP Password | Your API key (from Step 2) |
   | Enable SSL | ✓ (Checked) |
   | From Email | `onboarding@resend.dev` |
   | From Name | `SoloLvlUp` |

6. Click **Save**

## Step 4: Test Email Verification
1. Go to your signup page: https://your-app.vercel.app/auth/signup
2. Create a new account with a test email
3. You should receive a verification email from Resend
4. Click the verification link to confirm your email

## Troubleshooting

### "SMTP Authentication Failed"
- Double-check your API key is correct
- Make sure you copied the full key (including `re_` prefix)
- Verify SMTP Host is exactly `smtp.resend.com`

### "Email not received"
- Check your spam folder
- Verify the "From Email" is set to `onboarding@resend.dev` (required for free tier)
- Wait a few seconds - emails may take time to arrive

### Upgrade Resend for Custom Domain
After testing, you can upgrade Resend to send from your own domain:
1. Go to Resend Dashboard
2. Add your domain
3. Update Supabase SMTP "From Email" to your custom domain email
