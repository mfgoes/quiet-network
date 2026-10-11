'use client'

import { ArrowRight } from "lucide-react"
import { useDM } from "@/components/DMContext"
import { hustleCategory, type Listing } from "@/lib/hustle"

interface HustleBlockProps {
	listing: Listing
	authorId: string
	authorName?: string
	userId?: string
}

/**
 * The "new side hustle" announcement: the neighbourhood version of
 * LinkedIn's "I'm starting a new position" card. Sits above the post text.
 */
export function HustleBlock({ listing, authorId, authorName, userId }: HustleBlockProps) {
	const { startDM } = useDM()
	const cat = hustleCategory(listing.category)
	const canMessage = !!userId && userId !== authorId
	const firstName = (authorName ?? "them").split(" ")[0]

	return (
		<div className="mb-3 overflow-hidden rounded-[var(--radius)] border border-line bg-surface">
			{/* Category texture */}
			<div
				aria-hidden
				className="h-14 border-b border-line [--hustle-ink:var(--border-strong)] opacity-60"
				style={{ backgroundImage: cat.pattern, backgroundSize: cat.size }}
			/>
			<div className="px-4 pb-4 pt-3">
				<p className="label text-accent">New side hustle · {cat.label}</p>
				<h3 className="mt-1.5 text-xl leading-snug text-ink">{listing.title}</h3>
				{listing.price && <p className="mt-1 text-sm text-muted">{listing.price}</p>}
				{canMessage && (
					<button
						type="button"
						onClick={() => startDM(authorId)}
						className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-ink px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent sm:w-auto"
					>
						Message {firstName}
						<ArrowRight className="h-4 w-4" />
					</button>
				)}
			</div>
		</div>
	)
}
