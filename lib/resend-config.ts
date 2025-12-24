// Resend SMTP Configuration for Supabase
export const RESEND_SMTP_CONFIG = {
  host: "smtp.resend.com",
  port: 465,
  secure: true,
  auth: {
    user: "resend",
    pass: process.env.RESEND_API_KEY,
  },
  from: {
    email: "onboarding@resend.dev",
    name: "SoloLvlUp",
  },
}

// Use this configuration in your Supabase SMTP settings
export const getResendSMTPInstructions = () => ({
  smtp_host: "smtp.resend.com",
  smtp_port: 465,
  smtp_user: "resend",
  smtp_pass: process.env.RESEND_API_KEY,
  smtp_admin_email: "onboarding@resend.dev",
  smtp_sender_name: "SoloLvlUp",
  smtp_max_frequency: 50,
})
