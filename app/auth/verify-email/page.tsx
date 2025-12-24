"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const smtpError = searchParams.get("smtp_error") === "true"
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  const handleResendEmail = async () => {
    if (!email) return

    setIsResending(true)
    setResendMessage(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes("Error sending") || error.message.includes("SMTP")) {
          setResendMessage(
            "Email service temporarily unavailable. Your account is created - please contact support or try again later.",
          )
        } else {
          setResendMessage(error.message)
        }
      } else {
        setResendMessage("Verification email resent successfully! Check your inbox.")
      }
    } catch (error) {
      setResendMessage("Failed to resend email. Please try again later.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="w-full max-w-md">
        <Card className="border-cyan-500/20 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-400">
              {smtpError ? "Account Created!" : "Check Your Email"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {smtpError ? "Verification email pending" : "We've sent you a confirmation email"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {smtpError ? (
              <>
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
                  <p className="text-sm text-yellow-400 font-medium mb-2">Email Service Issue</p>
                  <p className="text-sm text-slate-300">
                    Your account has been created successfully, but we're experiencing temporary issues with our email
                    service. Your verification email may be delayed.
                  </p>
                </div>
                <p className="text-slate-300 text-sm">You can try the following:</p>
                <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                  <li>Wait a few minutes and check your spam/junk folder</li>
                  <li>Click the button below to resend the verification email</li>
                  <li>Contact support if the issue persists</li>
                </ul>
                {email && (
                  <Button
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="w-full bg-cyan-600 hover:bg-cyan-700"
                  >
                    {isResending ? "Resending..." : "Resend Verification Email"}
                  </Button>
                )}
              </>
            ) : (
              <>
                <p className="text-slate-300">
                  Please check your email {email && <span className="text-cyan-400">({email})</span>} and click the
                  confirmation link to activate your account.
                </p>
                <p className="text-sm text-slate-400">Once confirmed, you can log in and start your RPG journey!</p>
                {email && (
                  <Button
                    onClick={handleResendEmail}
                    disabled={isResending}
                    variant="outline"
                    className="w-full bg-transparent"
                  >
                    {isResending ? "Resending..." : "Resend Verification Email"}
                  </Button>
                )}
              </>
            )}

            {resendMessage && (
              <p className={`text-sm ${resendMessage.includes("successfully") ? "text-green-400" : "text-yellow-400"}`}>
                {resendMessage}
              </p>
            )}

            <div className="pt-4 border-t border-slate-700">
              <div className="text-center space-y-2">
                <Link
                  href="/auth/login"
                  className="text-cyan-400 underline underline-offset-4 hover:text-cyan-300 block"
                >
                  Back to Login
                </Link>
                <p className="text-xs text-slate-500">Having issues? Contact support for manual verification</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
