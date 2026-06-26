'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BadgeCheck, MapPin, MessageSquareText, ShieldCheck, Users } from 'lucide-react'
import { AuthForm } from '@/components/AuthForm'
import { useAuth } from '@/lib/hooks'

const quietFeatures = [
  {
    icon: Users,
    title: 'Local circles',
    description: 'Follow small, place-based communities for recommendations and updates.',
  },
  {
    icon: MessageSquareText,
    title: 'Useful posts',
    description: 'Ask questions, share experiences, and keep the signal higher than the noise.',
  },
  {
    icon: ShieldCheck,
    title: 'Account controls',
    description: 'Manage your profile, notifications, and trusted contribution history.',
  },
]

export default function WatchmakersLoginPage() {
  const router = useRouter()
  const { user, signIn, signUp, signInWithMagicLink, resetPassword } = useAuth()
  const [redirectTo, setRedirectTo] = useState('/watchmakers')

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
    <div className="min-h-screen bg-[#f7f4ee] text-quiet-slate">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <section className="relative flex min-h-[380px] flex-col justify-between overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-10 lg:min-h-screen lg:px-12">
          <img
            src="/images/watchmakers/watchmaker-bench.png"
            alt="Watchmaker workbench"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-slate-950/55" />

          <div className="relative z-10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/watchmakers')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition hover:text-white"
            >
              <MapPin className="h-4 w-4" />
              Watchmakers
            </button>
            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
              Quiet Network
            </span>
          </div>

          <div className="relative z-10 max-w-2xl pb-2 pt-24 lg:pt-0">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200/40 bg-emerald-50/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100">
              <BadgeCheck className="h-4 w-4" />
              Claim and contribute
            </div>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              Sign in to help keep trusted watchmaker records accurate.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/78">
              Claim your shop, submit service reports, and help collectors find repair benches they can actually trust.
            </p>
          </div>
        </section>

        <main className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <AuthForm
              onSignIn={signIn}
              onSignUp={signUp}
              onMagicLink={signInWithMagicLink}
              onForgotPassword={resetPassword}
              redirectTo={redirectTo}
              copy={{
                signInTitle: 'Sign in to Watchmakers',
                signUpTitle: 'Create your Watchmakers account',
                signUpSubtitle: 'Claim a profile, add a shop, or submit service reports.',
                magicLinkTitle: 'Get a Watchmakers sign-in link',
                magicLinkSubtitle: "We'll email a secure link back to Watchmakers.",
                forgotPasswordTitle: 'Reset your Watchmakers password',
                forgotPasswordSubtitle: "Enter your email and we'll send a reset link.",
                signUpToggle: 'New to Watchmakers? Create an account',
                signInToggle: 'Already have an account? Sign in',
              }}
            />

            <button
              onClick={() => router.push(redirectTo)}
              className="mt-4 w-full rounded-lg border border-quiet-border bg-white py-2.5 text-sm font-medium text-quiet-muted transition-colors hover:bg-quiet-border/30"
            >
              Browse watchmakers without signing in
            </button>

            <section className="mt-8 border-t border-quiet-border pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-quiet-muted">
                Also in Quiet Network
              </p>
              <div className="mt-4 space-y-3">
                {quietFeatures.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <div key={feature.title} className="flex gap-3 rounded-lg border border-quiet-border bg-white p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-quiet-accent/10 text-quiet-accent">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-quiet-slate">{feature.title}</h2>
                        <p className="mt-0.5 text-xs leading-5 text-quiet-muted">{feature.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
