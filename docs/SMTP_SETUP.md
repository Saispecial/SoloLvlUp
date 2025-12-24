# Setting Up Email Verification for SoloLvlUp

## Current Issue
The Supabase project is experiencing SMTP authentication errors when sending confirmation emails. This prevents users from receiving verification emails after signup.

## Error Details
```
Error: 535 5.7.8 Error: authentication failed
Message: Error sending confirmation email
```

## Solutions

### Option 1: Configure Custom SMTP (Recommended for Production)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Settings** > **Email**
3. Scroll to **SMTP Settings**
4. Configure with your email provider:

#### Using Gmail:
- SMTP Host: `smtp.gmail.com`
- SMTP Port: `587`
- SMTP Username: Your Gmail address
- SMTP Password: App-specific password (not your regular password)
- Enable TLS: Yes

#### Using SendGrid:
- SMTP Host: `smtp.sendgrid.net`
- SMTP Port: `587`
- SMTP Username: `apikey`
- SMTP Password: Your SendGrid API key
- Enable TLS: Yes

#### Using AWS SES:
- SMTP Host: Your SES SMTP endpoint (e.g., `email-smtp.us-east-1.amazonaws.com`)
- SMTP Port: `587`
- SMTP Username: Your SES SMTP username
- SMTP Password: Your SES SMTP password
- Enable TLS: Yes

### Option 2: Disable Email Confirmation (Development Only)

1. Go to Supabase Dashboard
2. Navigate to **Authentication** > **Settings**
3. Scroll to **Email Auth**
4. Toggle OFF: **Enable email confirmations**
5. Save changes

**Warning:** Only use this for development. Production apps should always verify emails.

### Option 3: Use Supabase Email Service (Upgrade Required)

Supabase offers a managed email service on paid plans that handles all SMTP configuration automatically.

1. Upgrade your project to a paid plan
2. The email service will be automatically configured
3. No additional SMTP setup required

## Current Workaround

The app now handles SMTP errors gracefully:
- Users are successfully created even if email fails
- Users see a clear message about email service issues
- "Resend Verification" button available
- Users can contact support for manual verification

## Testing Email Flow

After configuring SMTP:

1. Sign up with a test email
2. Check inbox (and spam folder)
3. Click verification link
4. Should redirect to app and auto-login

## Support

If issues persist, users can be manually verified using SQL:

```sql
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'user@example.com';
```

**Note:** Only use for legitimate users after verifying their identity.
