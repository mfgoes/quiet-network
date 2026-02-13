import { useState } from "react"
import { Button } from "@/components/ui/button"

interface AuthFormProps {
  onSignIn: (email: string, password: string, rememberMe?: boolean) => Promise<Error | null>
  onSignUp: (email: string, password: string) => Promise<Error | null>
}

export function AuthForm({ onSignIn, onSignUp }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = isSignUp
      ? await onSignUp(email, password)
      : await onSignIn(email, password, rememberMe)

    if (result) {
      setError(result.message)
    }
    setSubmitting(false)
  }

  return (
    <div className="mx-auto max-w-sm">
      {/* Header Section */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-quiet-slate">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h2>
        <p className="mt-1 text-sm text-quiet-muted">
          {isSignUp
            ? "Join your neighborhood on Quiet Network"
            : "Sign in to your Quiet Network account"}
        </p>
      </div>

      {/* Form Section with Visual Distinction */}
      <div className={`rounded-lg p-6 ${isSignUp ? "bg-quiet-accent/5 border-2 border-quiet-accent/20" : "bg-white border border-quiet-border"}`}>
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
              className="w-full rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate focus:border-quiet-accent focus:outline-none focus:ring-2 focus:ring-quiet-accent/20"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-quiet-slate"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate focus:border-quiet-accent focus:outline-none focus:ring-2 focus:ring-quiet-accent/20"
            />
            {isSignUp && (
              <p className="mt-1 text-xs text-quiet-muted">
                Minimum 6 characters
              </p>
            )}
          </div>

          {!isSignUp && (
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

          <Button type="submit" disabled={submitting} className="w-full">
            {isSignUp ? "Create account" : "Sign in"}
          </Button>
        </form>
      </div>

      {/* Toggle Section */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
            setRememberMe(true)
          }}
          className="text-sm text-quiet-accent hover:text-quiet-slate transition-colors font-medium"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </div>
    </div>
  )
}
