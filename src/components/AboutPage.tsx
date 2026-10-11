'use client'

import { useEffect, useRef, useState } from "react"
import { Link, Check, ArrowDown, ArrowRight } from "lucide-react"

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
	{ title: "Ephemeral by design", desc: "Posts fade after 48 hours, 7 days or 30 days. No permanent record, no regrets." },
	{ title: "Stay pseudonymous", desc: "Simple display names only. No real names, no social graph." },
	{ title: "Focused circles", desc: "Neighbourhoods, fan groups, hobby communities. Connect with your people." },
	{ title: "Topic tags", desc: "Quick questions, lost & found, local events, casual chat." },
	{ title: "Privacy first", desc: "Hosted in the EU. No tracking, no ads, no data selling." },
	{ title: "Calm by design", desc: "No follower counts, no karma, no FOMO. Just your community." },
]

const problems = [
	{
		title: "The surveillance economy",
		desc: "Mainstream platforms treat your conversations, your location and your data as products to be sold.",
		kicker: "Your community isn't a market; it's your space.",
	},
	{
		title: "The permanent record",
		desc: "Every post, every comment, every fleeting thought can be archived, screenshotted and used against you years later.",
		kicker: "Who wants that pressure in their community space?",
	},
	{
		title: "Loud, performative culture",
		desc: "Algorithms stir controversy and maximise “engagement” to keep you glued to the screen, at the expense of genuine connection.",
		kicker: "We don't need shouting matches in our communities.",
	},
	{
		title: "Clutter and irrelevance",
		desc: "Endless feeds of ads, sensational news and off-topic noise drown out what actually matters to you and your people.",
	},
]

const updates = [
	{
		date: "Jan 31",
		summary: "Added text styling and basic admin settings",
		items: ["Sticky homepage button to promote posts", "YouTube and Imgur embeds", "Profile links with social icon support"],
	},
	{ date: "Jan 30", summary: "Set up a new explore page" },
	{ date: "Jan 28", summary: "Started the project" },
]

function useCopyInvite() {
	const [copied, setCopied] = useState(false)
	const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/` : "https://quiet-network.vercel.app/"

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(inviteUrl)
		} catch {
			const input = document.createElement("input")
			input.value = inviteUrl
			document.body.appendChild(input)
			input.select()
			document.execCommand("copy")
			document.body.removeChild(input)
		}
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return { copied, copy }
}

const primaryButton =
	"inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-ink px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-accent"

function CopyInviteButton({ className = "" }: { className?: string }) {
	const { copied, copy } = useCopyInvite()
	return (
		<button type="button" onClick={copy} className={`${primaryButton} ${className}`}>
			{copied ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
			{copied ? "Link copied" : "Copy invite link"}
		</button>
	)
}

/** Section heading: mono eyebrow + serif title, ruled underneath. */
function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
	return (
		<div className="border-b border-line pb-3">
			<p className="label text-accent">{eyebrow}</p>
			<h2 className="mt-1.5 text-2xl text-ink md:text-3xl">{title}</h2>
		</div>
	)
}

export function AboutPage({ onJoin }: { onJoin?: () => void }) {
	return (
		<div className="mx-auto max-w-3xl space-y-16 px-1 pb-10 md:space-y-20">
			{/* Hero */}
			<FadeIn>
				<div className="pt-8 md:pt-16">
					<p className="label text-muted">About Quiet Network</p>
					<h1 className="mt-3 max-w-xl text-4xl leading-[1.05] text-ink md:text-6xl">
						Your community, <span className="italic text-accent">without the noise.</span>
					</h1>
					<p className="mt-5 max-w-md text-base leading-relaxed text-muted">
						A calm space for neighbourhoods, fan communities and interest groups. No ads, no drama, no permanent posts.
					</p>
					<div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
						{onJoin ? (
							<button type="button" onClick={onJoin} className={primaryButton}>
								Join your community
								<ArrowRight className="h-4 w-4" />
							</button>
						) : (
							<CopyInviteButton />
						)}
						<a href="#recent-updates" className="label inline-flex items-center gap-1.5 py-2 text-muted transition-colors hover:text-ink">
							Recent updates
							<ArrowDown className="h-3 w-3" />
						</a>
					</div>
				</div>
			</FadeIn>

			{/* Principles: open columns, no boxes */}
			<section>
				<FadeIn>
					<SectionHead eyebrow="Principles" title="What makes it quiet" />
				</FadeIn>
				<div className="mt-2 grid grid-cols-1 gap-x-8 sm:grid-cols-2 md:grid-cols-3">
					{features.map((f, i) => (
						<FadeIn key={f.title}>
							<div className="group relative py-6">
								<span aria-hidden className="absolute left-0 top-0 h-[2px] w-10 bg-accent transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:w-full" />
								<span className="label absolute right-0 top-4 text-faint">{String(i + 1).padStart(2, "0")}</span>
								<h3 className="text-lg text-ink">{f.title}</h3>
								<p className="mt-1.5 text-sm leading-relaxed text-muted">{f.desc}</p>
							</div>
						</FadeIn>
					))}
				</div>
			</section>

			{/* Philosophy */}
			<FadeIn>
				<section className="grid items-center gap-8 md:grid-cols-[1fr_16rem]">
					<div>
						<p className="label text-accent">Philosophy</p>
						<blockquote className="mt-3 font-display text-2xl leading-snug text-ink md:text-3xl">
							&ldquo;Your communities should be calm, consensual and truly yours.&rdquo;
						</blockquote>
						<p className="mt-4 text-sm leading-relaxed text-muted">
							We're reclaiming digital space for real neighbourhoods, fan groups and shared interests, prioritising mindful
							connection over engagement metrics.
						</p>
					</div>
					<img
						src="/images/about/hand transparent.jpg"
						alt="Transparent hand reaching out"
						className="w-full rounded-[var(--radius)] border border-line object-cover"
					/>
				</section>
			</FadeIn>

			{/* The problem: numbered list on hairlines */}
			<section>
				<FadeIn>
					<SectionHead eyebrow="Why" title="The problem we're solving" />
				</FadeIn>
				<ol>
					{problems.map((p, i) => (
						<FadeIn key={p.title}>
							<li className="grid grid-cols-[2.5rem_1fr] gap-x-2 border-b border-line py-5">
								<span className="label pt-1 text-accent">{String(i + 1).padStart(2, "0")}</span>
								<div>
									<h3 className="text-lg text-ink">{p.title}</h3>
									<p className="mt-1 text-sm leading-relaxed text-muted">
										{p.desc}
										{p.kicker && <> <span className="text-ink">{p.kicker}</span></>}
									</p>
								</div>
							</li>
						</FadeIn>
					))}
				</ol>
			</section>

			{/* Invite */}
			<FadeIn>
				<section className="border-y border-line py-10 text-center">
					<p className="label text-accent">Invite your people</p>
					<h2 className="mx-auto mt-2 max-w-md text-2xl text-ink md:text-3xl">A circle is only as good as who's in it.</h2>
					<p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
						Share Quiet Network with friends, neighbours and like-minded people. More of the right people means calmer, better conversations.
					</p>
					<CopyInviteButton className="mt-6" />
				</section>
			</FadeIn>

			{/* Maker note */}
			<FadeIn>
				<section className="flex items-start gap-4">
					<img src="/images/about/Mischa-4.jpg" alt="Mischa" className="h-14 w-14 flex-shrink-0 rounded-full object-cover" />
					<div>
						<p className="label text-muted">Under active development</p>
						<p className="mt-1.5 text-sm leading-relaxed text-ink">
							For support questions and feature requests, follow me on{" "}
							<a href="https://bsky.app/profile/mishotofu.bsky.social" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 hover:text-ink">
								Bluesky
							</a>{" "}
							or email{" "}
							<a href="mailto:mfgoes1@gmail.com" className="text-accent underline underline-offset-2 hover:text-ink">
								mfgoes1@gmail.com
							</a>
							.
						</p>
					</div>
				</section>
			</FadeIn>

			{/* Recent updates */}
			<FadeIn>
				<section id="recent-updates" className="scroll-mt-8">
					<SectionHead eyebrow="Changelog" title="Recent updates" />
					<ol className="mt-2">
						{updates.map((u) => (
							<li key={u.date} className="grid grid-cols-[4.5rem_1fr] gap-x-3 border-b border-line py-4">
								<span className="label pt-0.5 text-accent">{u.date}</span>
								<div>
									<p className="text-sm text-ink">{u.summary}</p>
									{u.items && (
										<ul className="mt-1.5 space-y-1">
											{u.items.map((item) => (
												<li key={item} className="text-sm text-muted before:mr-2 before:text-faint before:content-['–']">
													{item}
												</li>
											))}
										</ul>
									)}
								</div>
							</li>
						))}
						<li className="grid grid-cols-[4.5rem_1fr] gap-x-3 py-4">
							<span className="label pt-0.5 text-faint">Next</span>
							<p className="text-sm italic text-muted">More coming soon</p>
						</li>
					</ol>
				</section>
			</FadeIn>

			{/* Footer */}
			<footer className="border-t border-line pt-4">
				<p className="label text-muted">
					Built by{" "}
					<a href="https://mfgoes.github.io/portfolio-2026/" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-ink">
						@mischa
					</a>
				</p>
			</footer>
		</div>
	)
}
