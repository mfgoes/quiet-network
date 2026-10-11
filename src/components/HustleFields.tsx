'use client'

import { HUSTLE_CATEGORIES, type HustleCategory } from "@/lib/hustle"

interface HustleFieldsProps {
	title: string
	category: HustleCategory
	price: string
	onChange: (next: { title?: string; category?: HustleCategory; price?: string }) => void
}

/** Composer fields for announcing a side hustle. The post text becomes the description. */
export function HustleFields({ title, category, price, onChange }: HustleFieldsProps) {
	return (
		<div className="mb-3 space-y-3 rounded-[var(--radius)] border border-line bg-surface p-3">
			<p className="label text-accent">Announce a side hustle</p>
			<input
				value={title}
				onChange={(e) => onChange({ title: e.target.value })}
				placeholder="What do you make or offer? e.g. Custom 3D prints & spare parts"
				maxLength={80}
				className="w-full rounded-[var(--radius)] border border-line bg-background px-3 py-2.5 text-base text-ink placeholder:text-faint focus:border-accent focus:outline-none sm:text-sm"
			/>
			<div className="flex flex-wrap gap-1.5">
				{HUSTLE_CATEGORIES.map((c) => (
					<button
						key={c.id}
						type="button"
						onClick={() => onChange({ category: c.id })}
						className={`rounded-[var(--radius)] border px-2.5 py-1.5 text-xs transition-colors ${
							category === c.id ? "border-accent bg-accent text-on-accent" : "border-line text-muted hover:border-line-strong hover:text-ink"
						}`}
					>
						{c.label}
					</button>
				))}
			</div>
			<input
				value={price}
				onChange={(e) => onChange({ price: e.target.value })}
				placeholder="Price hint (optional), e.g. From €5 · pick up in Kleverpark"
				maxLength={60}
				className="w-full rounded-[var(--radius)] border border-line bg-background px-3 py-2.5 text-base text-ink placeholder:text-faint focus:border-accent focus:outline-none sm:text-sm"
			/>
		</div>
	)
}
