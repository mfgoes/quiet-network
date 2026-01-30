import { useEffect, useRef, useState } from "react"
import { Link, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible")
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}

function FadeIn({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useFadeIn()
  return (
    <div ref={ref} className={`fade-in-section ${className}`}>
      {children}
    </div>
  )
}

const features = [
  {
    icon: "⏱️",
    title: "Ephemeral by Design",
    desc: "Posts fade after 48h, 7d, or 30d. No permanent record, no regrets.",
  },
  {
    icon: "🎭",
    title: "Stay Pseudonymous",
    desc: "Simple display names only. No real names, no social graph.",
  },
  {
    icon: "📍",
    title: "Hyperlocal Circles",
    desc: "Haarlem, Amsterdam-West, your street. Connect with real neighbors.",
  },
  {
    icon: "🏷️",
    title: "Topic Tags",
    desc: "Quick questions, Lost & Found, local events, casual chat.",
  },
  {
    icon: "🔒",
    title: "Privacy-First",
    desc: (
      <span className="inline-flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center gap-1">
          <span className="text-base leading-none">🇪🇺</span>
          Hosted in the EU
        </span>
        — no tracking, no data selling.
      </span>
    ),
  },
  {
    icon: "😌",
    title: "Calm by Design",
    desc: "No followers, no karma, no FOMO. Just your neighborhood.",
  },
]

function InviteCard() {
  const [copied, setCopied] = useState(false)
  const inviteUrl = `${window.location.origin}/`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const input = document.createElement("input")
      input.value = inviteUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#DBEAFE] p-6 text-center space-y-3">
      <h3 className="text-lg font-bold text-quiet-slate">
        Invite Your People
      </h3>
      <p className="text-sm text-quiet-muted leading-relaxed max-w-md mx-auto">
        Spread Quiet Network to your friends, neighbors, and like-minded folks
        everywhere. More joiners = better, calmer connections for all. Who's next? ✨
      </p>
      <Button
        onClick={handleCopy}
        className="bg-quiet-slate text-quiet-offwhite hover:bg-quiet-accent transition-colors rounded-xl px-6"
      >
        {copied ? (
          <>
            <Check className="mr-1.5 h-4 w-4" />
            Link copied!
          </>
        ) : (
          <>
            <Link className="mr-1.5 h-4 w-4" />
            Copy invite link
          </>
        )}
      </Button>
    </div>
  )
}

export function AboutPage({ onJoin }: { onJoin?: () => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-8">
      {/* Hero */}
      <FadeIn>
        <div className="text-center space-y-3 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-quiet-slate">
            Your neighborhood, without the noise
          </h2>
          <p className="text-sm text-quiet-muted leading-relaxed">
            Quiet Network is a calm, hyperlocal space for your neighborhood
            &mdash; without ads, drama, or permanent posts.
          </p>
        </div>
      </FadeIn>

      {/* CTA */}
      {onJoin && (
        <FadeIn>
          <div className="max-w-sm mx-auto">
            <Button
              className="w-full bg-quiet-slate text-quiet-offwhite hover:bg-quiet-accent transition-colors text-base py-6 font-semibold rounded-xl"
              onClick={onJoin}
            >
              Join your neighborhood
            </Button>
          </div>
        </FadeIn>
      )}

      {/* Feature cards — 2 cols mobile, 3 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {features.map((f) => (
          <FadeIn key={f.title}>
            <div className="rounded-xl border border-quiet-border bg-white p-4 space-y-2 h-full">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="text-sm font-semibold text-quiet-slate">{f.title}</h3>
              <p className="text-xs text-quiet-muted leading-relaxed">{f.desc}</p>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Second CTA */}
      {onJoin && (
        <FadeIn>
          <div className="text-center space-y-3 max-w-sm mx-auto">
            <p className="text-sm text-quiet-muted">
              Ready to connect with your neighbors?
            </p>
            <Button
              className="w-full bg-quiet-slate text-quiet-offwhite hover:bg-quiet-accent transition-colors text-base py-6 font-semibold rounded-xl"
              onClick={onJoin}
            >
              Join your neighborhood
            </Button>
          </div>
        </FadeIn>
      )}

      {/* Invite card */}
      <FadeIn>
        <InviteCard />
      </FadeIn>

      {/* Footer */}
      <FadeIn>
        <div className="pt-4 border-t border-quiet-border text-center">
          <p className="text-xs text-quiet-muted">
            Built by{" "}
            <a
              href="https://mfgoes.github.io/portfolio-2026/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-quiet-accent hover:text-quiet-slate transition-colors"
            >
              @mischa
            </a>
          </p>
        </div>
      </FadeIn>
    </div>
  )
}
