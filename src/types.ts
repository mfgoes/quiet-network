export interface Profile {
  id: string
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
  }
}

export interface Circle {
  id: string
  name: string
  description: string | null
  about: string | null
  rules: string | null
  latitude: number | null
  longitude: number | null
  radius_km: number
  created_by: string
  created_at: string
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
