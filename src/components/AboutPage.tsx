import { ExternalLink } from "lucide-react"

export function AboutPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h2 className="text-lg font-semibold text-quiet-slate">
        About Quiet Network
      </h2>

      <div className="space-y-3 text-sm text-quiet-muted">
        <p>
          Quiet Network is a calm, hyperlocal space for your neighborhood
          &mdash; without the noise of ads, drama, or permanent posts.
        </p>
        <p>
          Posts fade away naturally after 48 hours, 7 days, or 30 days (your
          choice).
        </p>
        <p>Everything stays pseudonymous with simple display names.</p>
        <p>No follower counts, no karma, no tracking.</p>
        <p>Privacy-first: hosted in the EU, no data selling.</p>
        <p>
          Built for real neighbors: quick questions, lost &amp; found, local
          events, casual chat that disappears when it's done.
        </p>
      </div>

      <hr className="border-quiet-border" />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-quiet-slate">Meet Mischa</h3>
        <p className="text-sm text-quiet-muted">
          UX Designer with 6+ years of experience creating data-driven digital
          experiences. From designing enterprise applications to leading
          experimentation culture, I combine design thinking with measurable
          business impact to deliver solutions that users love and businesses
          value.
        </p>
        <div className="flex flex-col gap-1 text-sm">
          <a
            href="https://mfgoes.github.io/portfolio-2026/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-quiet-accent hover:text-quiet-slate transition-colors"
          >
            Portfolio
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="https://github.com/mfgoes"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-quiet-accent hover:text-quiet-slate transition-colors"
          >
            GitHub
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
