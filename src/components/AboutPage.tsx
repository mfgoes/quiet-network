import { useEffect, useRef, useState } from "react"
import { Link, Check, Shield, AlertTriangle, Send, Volume2, ChevronDown } from "lucide-react"
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

function HeroCopyLink() {
  const [copied, setCopied] = useState(false)
  const inviteUrl = `${window.location.origin}/`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
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
    <Button
      onClick={handleCopy}
      className="bg-quiet-slate text-quiet-offwhite hover:bg-quiet-accent transition-colors text-base py-6 px-10 font-semibold rounded-xl"
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
  )
}

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
        <div className="text-center space-y-5 max-w-lg mx-auto py-8 md:py-14">
          <h2 className="text-3xl md:text-4xl font-bold text-quiet-slate leading-tight">
            Your neighborhood, without the noise
          </h2>
          <p className="text-base text-quiet-muted leading-relaxed max-w-md mx-auto">
            Quiet Network is a calm, hyperlocal space for your neighborhood
            &mdash; without ads, drama, or permanent posts.
          </p>
          <div className="flex flex-col items-center gap-3 pt-2">
            {onJoin ? (
              <Button
                className="bg-quiet-slate text-quiet-offwhite hover:bg-quiet-accent transition-colors text-base py-6 px-10 font-semibold rounded-xl"
                onClick={onJoin}
              >
                Join your neighborhood
              </Button>
            ) : (
              <HeroCopyLink />
            )}
            <a
              href="#recent-updates"
              className="inline-flex items-center gap-1.5 text-sm text-quiet-muted hover:text-quiet-slate transition-colors"
            >
              See recent updates
              <ChevronDown className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </FadeIn>

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

      {/* Our Philosophy */}
      <FadeIn>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-3">
            <h2 className="text-xl font-bold text-quiet-slate">Our Philosophy</h2>
            <p className="text-sm text-quiet-muted leading-relaxed">
              Quiet Network is built on a simple, yet radical idea:{" "}
              <strong className="text-quiet-slate">
                your local connections should be calm, consensual, and truly yours.
              </strong>{" "}
              We're here to reclaim the digital space for real neighborhoods,
              prioritizing mindful community over engagement metrics.
            </p>
          </div>
          <div className="flex-shrink-0 w-full md:w-72">
            <img
              src="/images/about/hand transparent.jpg"
              alt="Transparent hand reaching out"
              className="w-full rounded-xl object-cover"
            />
          </div>
        </div>
      </FadeIn>

      {/* The Problem We're Solving */}
      <FadeIn>
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-quiet-slate">
            The Problem We're Solving
          </h2>
          <div className="space-y-3">
            {[
              {
                icon: Shield,
                title: "The Surveillance Economy",
                desc: (
                  <>
                    Mainstream platforms treat your conversations, your location, and your data as products to be sold.{" "}
                    <strong className="text-quiet-slate">Your neighborhood isn't a market; it's your home.</strong>
                  </>
                ),
              },
              {
                icon: AlertTriangle,
                title: "The Digital Permanent Record",
                desc: (
                  <>
                    Every post, every comment, every fleeting thought can be archived, screenshotted, and used against you years later.{" "}
                    <strong className="text-quiet-slate">Who wants that kind of pressure just to ask for sugar?</strong>
                  </>
                ),
              },
              {
                icon: Send,
                title: "The Loud, Performative Culture",
                desc: (
                  <>
                    Algorithms are designed to stir controversy, maximize "engagement," and keep you glued to your screen, often at the expense of genuine connection.{" "}
                    <strong className="text-quiet-slate">We don't need digital shouting matches over local issues.</strong>
                  </>
                ),
              },
              {
                icon: Volume2,
                title: "The Clutter and Irrelevance",
                desc: "Endless feeds packed with ads, sensationalized news, and posts from people miles away, drowning out what actually matters right on your street.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-xl border border-quiet-border bg-white p-5"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <item.icon className="h-5 w-5 text-quiet-muted" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-quiet-slate">{item.title}</h3>
                  <p className="text-sm text-quiet-muted leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Invite card */}
      <FadeIn>
        <InviteCard />
      </FadeIn>

      {/* Under development notice */}
      <FadeIn>
        <div className="rounded-xl border border-quiet-border bg-white p-6 flex flex-col items-center gap-4">
          <img
            src="/images/about/Mischa-4.jpg"
            alt="Mischa"
            className="h-20 w-20 rounded-full object-cover"
          />
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-quiet-slate">
              This site is under active development
            </p>
            <p className="text-sm text-quiet-muted leading-relaxed">
              For support questions and feature requests, follow me on{" "}
              <a
                href="https://bsky.app/profile/mishotofu.bsky.social"
                target="_blank"
                rel="noopener noreferrer"
                className="text-quiet-accent hover:text-quiet-slate transition-colors underline"
              >
                Bluesky
              </a>{" "}
              or email{" "}
              <a
                href="mailto:mfgoes1@gmail.com"
                className="text-quiet-accent hover:text-quiet-slate transition-colors underline"
              >
                mfgoes1@gmail.com
              </a>
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Recent Updates */}
      <FadeIn>
        <div id="recent-updates" className="scroll-mt-8 space-y-5">
          <h2 className="text-xl font-bold text-quiet-slate">Recent Updates</h2>
          <div className="relative pl-6 border-l-2 border-quiet-border space-y-6">
            {[
              { date: "Jan 31", text: "Added text styling and basic admin settings" },
              { date: "Jan 30", text: "Setup a new explore page" },
              { date: "Jan 28", text: "Started the project!" },
            ].map((entry) => (
              <div key={entry.date} className="relative">
                <div className="absolute -left-[1.8125rem] top-1 h-2.5 w-2.5 rounded-full bg-quiet-accent" />
                <p className="text-xs font-medium text-quiet-accent">{entry.date}</p>
                <p className="text-sm text-quiet-slate mt-0.5">{entry.text}</p>
              </div>
            ))}
            <div className="relative">
              <div className="absolute -left-[1.8125rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-quiet-border bg-quiet-offwhite" />
              <p className="text-sm text-quiet-muted italic">More coming soon...</p>
            </div>
          </div>
        </div>
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
