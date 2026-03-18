import type { Post } from "@/types"

// Deterministic per-post-per-session jitter using djb2 + murmurhash3 finalizer
export function seededRandom(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  // murmurhash3 fmix32 — ensures small input changes flip ~50% of output bits
  hash ^= hash >>> 16
  hash = Math.imul(hash, 0x85ebca6b)
  hash ^= hash >>> 13
  hash = Math.imul(hash, 0xc2b2ae35)
  hash ^= hash >>> 16
  return (hash >>> 0) / 0xFFFFFFFF
}

// Score weights
const RECENCY_HALF_LIFE_HOURS = 72   // halves every 3 days
const ENGAGEMENT_WEIGHT = 0.3        // log-scale engagement bonus
const INTERACTION_PENALTY = 10.0     // buries interacted posts
const RANDOM_WEIGHT = 0.4            // max jitter per session
const FAVORITE_BOOST = 0.6           // bumps posts from starred circles

export function scorePost(post: Post, sessionSeed: number, favoritedCircleIds?: string[]): number {
  const ageHours = (Date.now() - new Date(post.created_at).getTime()) / 3_600_000
  const recency = Math.exp(-(Math.LN2 / RECENCY_HALF_LIFE_HOURS) * ageHours)
  const engagement = Math.log(post.upvote_count + post.reply_count + 1) * ENGAGEMENT_WEIGHT
  const penalty = (post.user_upvoted || post.user_replied) ? INTERACTION_PENALTY : 0
  const jitter = seededRandom(`${post.id}:${sessionSeed}`) * RANDOM_WEIGHT
  const favorite = favoritedCircleIds?.includes(post.circle_id ?? "") ? FAVORITE_BOOST : 0
  return recency + engagement + jitter + favorite - penalty
}

// Welcome posts pinned at top, everything else scored and shuffled
export function sortPostsWithFreshness(posts: Post[], sessionSeed: number, favoritedCircleIds?: string[]): Post[] {
  if (posts.length === 0) return []
  const filtered = posts.filter(p => !p.is_welcome)
  filtered.sort((a, b) => scorePost(b, sessionSeed, favoritedCircleIds) - scorePost(a, sessionSeed, favoritedCircleIds))
  return filtered
}
