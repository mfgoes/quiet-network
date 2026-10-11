// Side hustles: a neighbour announcing something they make or offer.
// Stored on a post as `listing` (jsonb, see supabase/migration-post-listing.sql).

export type HustleCategory = "print3d" | "food" | "repair" | "craft" | "lessons" | "service" | "other"

export interface Listing {
	kind: "hustle"
	category: HustleCategory
	title: string
	price?: string | null
}

// Each category has its own quiet texture, drawn with CSS only.
// 3D printing is layer lines, baking is a dot grid, repairs are hatching...
export const HUSTLE_CATEGORIES: { id: HustleCategory; label: string; pattern: string; size?: string }[] = [
	{ id: "print3d", label: "3D printing", pattern: "repeating-linear-gradient(0deg, var(--hustle-ink) 0 1px, transparent 1px 6px)" },
	{ id: "food", label: "Baking & food", pattern: "radial-gradient(var(--hustle-ink) 1.2px, transparent 1.6px)", size: "10px 10px" },
	{ id: "repair", label: "Repairs", pattern: "repeating-linear-gradient(45deg, var(--hustle-ink) 0 1px, transparent 1px 8px)" },
	{ id: "craft", label: "Crafts & art", pattern: "repeating-linear-gradient(45deg, var(--hustle-ink) 0 1px, transparent 1px 9px), repeating-linear-gradient(-45deg, var(--hustle-ink) 0 1px, transparent 1px 9px)" },
	{ id: "lessons", label: "Lessons", pattern: "linear-gradient(var(--hustle-ink) 1px, transparent 1px), linear-gradient(90deg, var(--hustle-ink) 1px, transparent 1px)", size: "14px 14px" },
	{ id: "service", label: "Services", pattern: "repeating-linear-gradient(90deg, var(--hustle-ink) 0 1px, transparent 1px 7px)" },
	{ id: "other", label: "Other", pattern: "radial-gradient(var(--hustle-ink) 0.8px, transparent 1.2px)", size: "6px 6px" },
]

export function hustleCategory(id: string | undefined | null) {
	return HUSTLE_CATEGORIES.find((c) => c.id === id) ?? HUSTLE_CATEGORIES[HUSTLE_CATEGORIES.length - 1]
}

export function isHustle(listing: unknown): listing is Listing {
	return !!listing && typeof listing === "object" && (listing as Listing).kind === "hustle" && !!(listing as Listing).title
}
