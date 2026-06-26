'use client'

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AuthFormProps {
  onSignIn: (email: string, password: string, rememberMe?: boolean) => Promise<Error | null>
  onSignUp: (email: string, password: string, redirectTo?: string) => Promise<Error | null>
  onMagicLink: (email: string, redirectTo?: string) => Promise<Error | null>
  onForgotPassword: (email: string) => Promise<Error | null>
  redirectTo?: string
  copy?: Partial<AuthFormCopy>
}

type Mode = "sign-in" | "sign-up" | "magic-link" | "forgot-password"

type AuthFormCopy = {
  signInTitle: string
  signUpTitle: string
  signUpSubtitle: string
  magicLinkTitle: string
  magicLinkSubtitle: string
  forgotPasswordTitle: string
  forgotPasswordSubtitle: string
  signUpToggle: string
  signInToggle: string
}

const DEFAULT_COPY: AuthFormCopy = {
  signInTitle: "Your neighborhood, without the noise",
  signUpTitle: "Create your account",
  signUpSubtitle: "Join your neighborhood on Quiet Network",
  magicLinkTitle: "Sign in with magic link",
  magicLinkSubtitle: "We'll email you a link to sign in, no password needed",
  forgotPasswordTitle: "Reset your password",
  forgotPasswordSubtitle: "Enter your email and we'll send you a reset link",
  signUpToggle: "New here? Create an account",
  signInToggle: "Already have an account? Sign in",
}

export function AuthForm({ onSignIn, onSignUp, onMagicLink, onForgotPassword, redirectTo, copy }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<Mode>("sign-in")
  const formCopy = { ...DEFAULT_COPY, ...copy }
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    let result: Error | null = null

    if (mode === "magic-link") {
      result = await onMagicLink(email, redirectTo)
      if (!result) {
        setMagicLinkSent(true)
        setSubmitting(false)
        return
      }
    } else if (mode === "forgot-password") {
      result = await onForgotPassword(email)
      if (!result) {
        setResetSent(true)
        setSubmitting(false)
        return
      }
    } else if (mode === "sign-up") {
      result = await onSignUp(email, password, redirectTo)
    } else {
      result = await onSignIn(email, password, rememberMe)
    }

    if (result) {
      setError(result.message)
    }
    setSubmitting(false)
  }

  const switchMode = (newMode: Mode) => {
    setMode(newMode)
    setError(null)
    setMagicLinkSent(false)
    setResetSent(false)
    setRememberMe(true)
    setShowPassword(false)
  }

  // ── Confirmation screens ──────────────────────────────

  if (mode === "magic-link" && magicLinkSent) {
    return (
      <div className="mx-auto max-w-sm">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-quiet-slate">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-quiet-muted">
            We sent a magic link to <strong className="text-quiet-slate">{email}</strong>.
            Click the link in the email to sign in.
          </p>
        </div>

        <div className="rounded-lg p-6 bg-quiet-accent/5 border-2 border-quiet-accent/20 text-center">
          <p className="text-sm text-quiet-slate">
            Check your email for the magic link!
          </p>
          <p className="mt-2 text-xs text-quiet-muted">
            Didn't get it? Check your spam folder.
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => switchMode("sign-in")}
            className="text-sm text-quiet-muted hover:text-quiet-slate transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  if (mode === "forgot-password" && resetSent) {
    return (
      <div className="mx-auto max-w-sm">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-quiet-slate">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-quiet-muted">
            We sent a password reset link to <strong className="text-quiet-slate">{email}</strong>.
          </p>
        </div>

        <div className="rounded-lg p-6 bg-quiet-accent/5 border-2 border-quiet-accent/20 text-center">
          <p className="text-sm text-quiet-slate">
            Check your email for the reset link!
          </p>
          <p className="mt-2 text-xs text-quiet-muted">
            Didn't get it? Check your spam folder.
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => switchMode("sign-in")}
            className="text-sm text-quiet-muted hover:text-quiet-slate transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  // ── Main form ─────────────────────────────────────────

  return (
    <div className="mx-auto max-w-sm">
      {/* Header Section */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-quiet-slate md:text-3xl">
          {mode === "sign-up"
            ? formCopy.signUpTitle
            : mode === "magic-link"
              ? formCopy.magicLinkTitle
              : mode === "forgot-password"
                ? formCopy.forgotPasswordTitle
                : formCopy.signInTitle}
        </h1>
        {mode === "sign-up" && (
          <p className="mt-1 text-sm text-quiet-muted">
            {formCopy.signUpSubtitle}
          </p>
        )}
        {mode === "magic-link" && (
          <p className="mt-1 text-sm text-quiet-muted">
            {formCopy.magicLinkSubtitle}
          </p>
        )}
        {mode === "forgot-password" && (
          <p className="mt-1 text-sm text-quiet-muted">
            {formCopy.forgotPasswordSubtitle}
          </p>
        )}
      </div>

      {/* Form Section */}
      <div className={`rounded-lg p-6 ${mode === "sign-up" ? "bg-quiet-accent/5 border-2 border-quiet-accent/20" : "bg-white border border-quiet-border"}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-quiet-slate"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate focus:border-quiet-accent focus:outline-none focus:ring-2 focus:ring-quiet-accent/20"
            />
          </div>

          {mode !== "magic-link" && mode !== "forgot-password" && (
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-quiet-slate"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                  className="w-full rounded-md border border-quiet-border bg-white p-2.5 pr-10 text-sm text-quiet-slate focus:border-quiet-accent focus:outline-none focus:ring-2 focus:ring-quiet-accent/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-quiet-muted hover:text-quiet-slate transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === "sign-up" && (
                <p className="mt-1 text-xs text-quiet-muted">
                  Minimum 6 characters
                </p>
              )}
              {mode === "sign-in" && (
                <div className="mt-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => switchMode("forgot-password")}
                    className="text-xs text-quiet-muted hover:text-quiet-accent transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === "sign-in" && (
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-quiet-border text-quiet-accent focus:ring-quiet-accent"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 text-sm text-quiet-muted"
              >
                Remember me for 30 days
              </label>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-quiet-warm/10 p-3 border border-quiet-warm/20">
              <p className="text-sm text-quiet-warm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            variant="primary"
            className="w-full h-11 text-[15px]"
          >
            {submitting
              ? "..."
              : mode === "sign-up"
                ? "Create account"
                : mode === "magic-link"
                  ? "Send magic link"
                  : mode === "forgot-password"
                    ? "Send reset link"
                    : "Sign in"}
          </Button>
        </form>

        {/* Inline magic-link prompt (sign-in mode only) */}
        {mode === "sign-in" && (
          <p className="mt-4 text-center text-xs text-quiet-muted">
            Prefer passwordless?{" "}
            <button
              type="button"
              onClick={() => switchMode("magic-link")}
              className="text-quiet-accent hover:text-quiet-slate transition-colors font-medium"
            >
              Sign in with a magic link
            </button>
          </p>
        )}

        {/* Back link for sub-modes */}
        {(mode === "magic-link" || mode === "forgot-password") && (
          <p className="mt-4 text-center text-xs text-quiet-muted">
            <button
              type="button"
              onClick={() => switchMode("sign-in")}
              className="text-quiet-accent hover:text-quiet-slate transition-colors font-medium"
            >
              Back to sign in with password
            </button>
          </p>
        )}
      </div>

      {/* Sign-up / Sign-in toggle */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => switchMode(mode === "sign-up" ? "sign-in" : "sign-up")}
          className="text-sm text-quiet-muted hover:text-quiet-slate transition-colors"
        >
          {mode === "sign-up"
            ? formCopy.signInToggle
            : formCopy.signUpToggle}
        </button>
      </div>
    </div>
  )
}
