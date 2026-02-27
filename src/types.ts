export interface ProfileLink {
  label: string
  url: string
}

export interface Profile {
  id: string
  username: string
  display_name: string
  avatar_emoji: string
  bio: string
  country?: string | null
  links: ProfileLink[] | null
  created_at: string
  is_bot?: boolean
  posts_public?: boolean
}

export interface NotificationPreferences {
  id: string
  user_id: string
  notify_on_replies: boolean
  notify_on_mentions: boolean
  notify_weekly_digest: boolean
  notify_on_circle_updates: boolean
  push_enabled: boolean
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'reply' | 'upvote' | 'mention' | 'circle_post'
  actor_id: string | null
  post_id: string | null
  reply_id: string | null
  circle_id: string | null
  read: boolean
  created_at: string
  actor?: Pick<Profile, 'display_name' | 'avatar_emoji' | 'username'>
  post?: Pick<Post, 'content' | 'circle_id'> & { circles?: { name: string; slug: string } }
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
  is_permanent: boolean
  edited: boolean
  updated_at: string | null
  image_url: string | null
  profiles?: {
    display_name: string
    avatar_emoji: string
    username: string
    is_bot?: boolean
  }
  circles?: {
    name: string
    slug: string
    description: string | null
    avatar_url: string | null
  }
  tags: string[]
  upvote_count: number
  user_upvoted: boolean
  user_replied: boolean
  reply_count: number
}

export interface Reply {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  profiles?: {
    display_name: string
    avatar_emoji: string
    username: string
    is_bot?: boolean
  }
  upvote_count: number
  user_upvoted: boolean
}

export interface CircleLink {
  label: string
  url: string
}

export interface Circle {
  id: string
  name: string
  slug: string
  description: string | null
  about: string | null
  rules: string | null
  links: CircleLink[] | null
  banner_color: string | null
  avatar_url: string | null
  latitude: number | null
  longitude: number | null
  radius_km: number
  country?: string | null
  default_permanent_posts?: boolean
  created_by: string
  created_at: string
}

export interface BannerColorDef {
  id: string
  bg: string
}

export const BANNER_COLORS: BannerColorDef[] = [
  { id: "sky", bg: "#BAE6FD" },
  { id: "mint", bg: "#A7F3D0" },
  { id: "lavender", bg: "#DDD6FE" },
  { id: "peach", bg: "#FED7AA" },
  { id: "blush", bg: "#FECDD3" },
  { id: "lemon", bg: "#FEF08A" },
  { id: "slate", bg: "#CBD5E1" },
  { id: "lilac", bg: "#E9D5FF" },
  { id: "sage", bg: "#BBF7D0" },
  { id: "coral", bg: "#FECACA" },
]

export function getBannerBg(bannerColor: string | null, circleName: string): string {
  if (bannerColor) {
    const preset = BANNER_COLORS.find((c) => c.id === bannerColor)
    if (preset) return preset.bg
  }
  return circleColor(circleName).bg
}

// ─── Admin panel types ──────────────────────────────

export type CircleRole = "admin" | "moderator" | "member"

export interface AdminCircleMember {
  user_id: string
  display_name: string
  avatar_emoji: string
  username: string
  is_bot?: boolean
  role: CircleRole
  joined_at: string
  post_count: number
  upvote_count: number
}

export interface Report {
  id: string
  circle_id: string
  post_id: string
  reported_by: string
  reason: string
  status: "pending" | "reviewed" | "dismissed"
  reviewed_by: string | null
  created_at: string
  reviewed_at: string | null
  post?: {
    content: string
    author_id: string
    profiles?: {
      display_name: string
      avatar_emoji: string
      username: string
    }
  }
  reporter?: {
    display_name: string
    avatar_emoji: string
    username: string
  }
}

export interface BannedUser {
  id: string
  circle_id: string
  user_id: string
  banned_by: string
  reason: string
  created_at: string
  profile?: {
    display_name: string
    avatar_emoji: string
    username: string
  }
  banned_by_profile?: {
    display_name: string
  }
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
  { label: "Permanent", seconds: 0 },
] as const

export const AVATAR_OPTIONS = [
  "house", "fox", "hills", "man", "roof", "woman", "cat", "bubu", "jjk", "nana", "llama",
] as const

export function avatarUrl(avatar: string): string {
  const extension = avatar === "llama" ? "gif" : "jpg"
  return `/images/avatars/${avatar}.${extension}`
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

// ─── Circle icon colors ─────────────────────────────

const CIRCLE_PASTELS = [
  { bg: "#DBEAFE", text: "#1E40AF" }, // blue
  { bg: "#D1FAE5", text: "#065F46" }, // green
  { bg: "#FEF3C7", text: "#92400E" }, // amber
  { bg: "#FCE7F3", text: "#9D174D" }, // pink
  { bg: "#EDE9FE", text: "#5B21B6" }, // purple
  { bg: "#CFFAFE", text: "#155E75" }, // cyan
  { bg: "#FEE2E2", text: "#991B1B" }, // red
  { bg: "#E0E7FF", text: "#3730A3" }, // indigo
] as const

export function circleColor(name: string): { bg: string; text: string } {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CIRCLE_PASTELS[Math.abs(hash) % CIRCLE_PASTELS.length]
}

export function circleInitial(name: string): string {
  return (name[0] || "?").toUpperCase()
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
