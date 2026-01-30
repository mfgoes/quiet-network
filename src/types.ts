export interface Profile {
  id: string
  username: string
  display_name: string
  avatar_emoji: string
  bio: string
  created_at: string
}

export interface Post {
  id: string
  circle_id: string
  author_id: string
  content: string
  created_at: string
  expires_at: string
  original_duration_seconds: number
  is_welcome: boolean
  profiles?: {
    display_name: string
    avatar_emoji: string
    username: string
  }
  tags: string[]
  upvote_count: number
  user_upvoted: boolean
}

export interface Circle {
  id: string
  name: string
  slug: string
  description: string | null
  about: string | null
  rules: string | null
  latitude: number | null
  longitude: number | null
  radius_km: number
  created_by: string
  created_at: string
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export const DURATION_OPTIONS = [
  { label: "48 hours", seconds: 48 * 60 * 60 },
  { label: "7 days", seconds: 7 * 24 * 60 * 60 },
  { label: "30 days", seconds: 30 * 24 * 60 * 60 },
] as const

export const AVATAR_OPTIONS = [
  "house", "fox", "hills", "man", "roof", "woman",
] as const

export function avatarUrl(avatar: string): string {
  return `/images/avatars/${avatar}.jpg`
}

export interface TagDef {
  id: string
  label: string
  color: string
}

export const TAGS: TagDef[] = [
  // Everyday
  { id: "quick-question", label: "#quick-question", color: "var(--color-tag-blue)" },
  { id: "lost-and-found", label: "#lost-and-found", color: "var(--color-tag-amber)" },
  { id: "recommendations", label: "#recommendations", color: "var(--color-tag-green)" },
  { id: "free-stuff", label: "#free-stuff", color: "var(--color-tag-cyan)" },
  { id: "secondhand", label: "#secondhand", color: "var(--color-tag-cyan)" },
  { id: "help-needed", label: "#help-needed", color: "var(--color-tag-pink)" },
  { id: "volunteer", label: "#volunteer", color: "var(--color-tag-green)" },
  // Community
  { id: "local-events", label: "#local-events", color: "var(--color-tag-purple)" },
  { id: "noise-complaint", label: "#noise-complaint", color: "var(--color-tag-amber)" },
  { id: "safety", label: "#safety", color: "var(--color-tag-pink)" },
  { id: "neighbors", label: "#neighbors", color: "var(--color-tag-blue)" },
  // Interests
  { id: "sports", label: "#sports", color: "var(--color-tag-green)" },
  { id: "gardening", label: "#gardening", color: "var(--color-tag-green)" },
  { id: "cycling", label: "#cycling", color: "var(--color-tag-cyan)" },
  { id: "food", label: "#food", color: "var(--color-tag-amber)" },
  { id: "pets", label: "#pets", color: "var(--color-tag-pink)" },
  { id: "parents", label: "#parents", color: "var(--color-tag-purple)" },
]

export function getTagDef(tagId: string): TagDef | undefined {
  return TAGS.find((t) => t.id === tagId)
}

export const POST_SPARKS = [
  "Best coffee nearby?",
  "Anyone found lost items?",
  "Good walks in the area?",
  "Recommend a local handyman?",
  "What's that sound last night?",
  "Free stuff on my curb!",
  "Best takeout around here?",
  "Any community events soon?",
  "Quiet park recommendations?",
  "Favorite local bookstore?",
] as const
