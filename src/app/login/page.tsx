'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks'
import { AuthForm } from '@/components/AuthForm'

export default function LoginPage() {
  const router = useRouter()
  const { user, signIn, signUp, signInWithMagicLink, resetPassword } = useAuth()
  const [redirectTo, setRedirectTo] = useState('/')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect')
    if (redirect?.startsWith('/')) {
      setRedirectTo(redirect)
    }
  }, [])

  useEffect(() => {
    if (user) router.replace(redirectTo)
  }, [redirectTo, user, router])

  return (
    <div className="min-h-screen bg-quiet-offwhite">
      <div className="md:hidden">
        <img src="/images/landscape_with_boats.jpg" alt="Quiet neighborhood" className="h-48 w-full object-cover" />
        <div className="px-6 py-8">
          <AuthForm onSignIn={signIn} onSignUp={signUp} onMagicLink={signInWithMagicLink} onForgotPassword={resetPassword} />
          <button
            onClick={() => router.push(redirectTo)}
            className="mt-4 w-full rounded-lg border border-quiet-border py-2.5 text-sm font-medium text-quiet-muted hover:bg-quiet-border/30 transition-colors"
          >
            Browse without signing in
          </button>
          <button
            onClick={() => router.push('/about')}
            className="mt-4 w-full text-center text-xs text-quiet-muted hover:text-quiet-accent transition-colors"
          >
            Learn more about Quiet Network
          </button>
        </div>
      </div>
      <div className="hidden md:flex md:min-h-screen">
        <div className="relative w-1/2">
          <img src="/images/landscape_with_boats.jpg" alt="Quiet neighborhood" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="flex w-1/2 items-center justify-center px-12">
          <div className="w-full max-w-sm">
            <AuthForm onSignIn={signIn} onSignUp={signUp} onMagicLink={signInWithMagicLink} onForgotPassword={resetPassword} />
            <button
              onClick={() => router.push(redirectTo)}
              className="mt-4 w-full rounded-lg border border-quiet-border py-2.5 text-sm font-medium text-quiet-muted hover:bg-quiet-border/30 transition-colors"
            >
              Browse without signing in
            </button>
            <button
              onClick={() => router.push('/about')}
              className="mt-4 w-full text-center text-xs text-quiet-muted hover:text-quiet-accent transition-colors"
            >
              Learn more about Quiet Network
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
