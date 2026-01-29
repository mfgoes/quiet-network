import { useState } from "react"
import { Button } from "@/components/ui/button"

interface AuthFormProps {
  onSignIn: (email: string, password: string) => Promise<Error | null>
  onSignUp: (email: string, password: string) => Promise<Error | null>
}

export function AuthForm({ onSignIn, onSignUp }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = isSignUp
      ? await onSignUp(email, password)
      : await onSignIn(email, password)

    if (result) {
      setError(result.message)
    }
    setSubmitting(false)
  }

  return (
    <div className="mx-auto max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm text-quiet-muted"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate focus:border-quiet-accent focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm text-quiet-muted"
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
            className="w-full rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate focus:border-quiet-accent focus:outline-none"
          />
        </div>

        {error && (
          <p className="text-sm text-quiet-warm">{error}</p>
        )}

        <Button type="submit" disabled={submitting} className="w-full">
          {isSignUp ? "Create account" : "Sign in"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setIsSignUp(!isSignUp)
          setError(null)
        }}
        className="mt-4 w-full text-center text-sm text-quiet-muted hover:text-quiet-slate"
      >
        {isSignUp
          ? "Already have an account? Sign in"
          : "New here? Create an account"}
      </button>
    </div>
  )
}
