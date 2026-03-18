import { useEffect, useState } from "react"
import { ExternalLink } from "lucide-react"

// ── X / Twitter ────────────────────────────────────────

export function isXTweetUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, "")
    if (host === "x.com" || host === "twitter.com") {
      return /^\/[^/]+\/status\/\d+/.test(u.pathname)
    }
  } catch { /* invalid URL */ }
  return false
}

function parseXUrl(url: string): { username: string; canonicalUrl: string } | null {
  try {
    const u = new URL(url)
    const match = u.pathname.match(/^\/([^/]+)\/status\/(\d+)/)
    if (match) return {
      username: match[1],
      canonicalUrl: `https://x.com/${match[1]}/status/${match[2]}`,
    }
  } catch { /* invalid URL */ }
  return null
}

const XLogo = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

// ── Bluesky ────────────────────────────────────────────

export function isBlueskyUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.hostname === "bsky.app" && /^\/profile\/[^/]+\/post\//.test(u.pathname)
  } catch { /* invalid URL */ }
  return false
}

export function isBlueskyProfileUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.hostname === "bsky.app" && /^\/profile\/[^/]+\/?$/.test(u.pathname)
  } catch { /* invalid URL */ }
  return false
}

function parseBlueskyUrl(url: string): { username: string; rkey: string; canonicalUrl: string } | null {
  try {
    const u = new URL(url)
    const match = u.pathname.match(/^\/profile\/([^/]+)\/post\/([^/]+)/)
    if (match) return { username: match[1], rkey: match[2], canonicalUrl: url }
  } catch { /* invalid URL */ }
  return null
}

function useBlueskyMeta(handle: string | null, rkey: string | null): PostMeta | null {
  const [meta, setMeta] = useState<PostMeta | null>(null)
  useEffect(() => {
    if (!handle || !rkey) return
    const atUri = `at://${handle}/app.bsky.feed.post/${rkey}`
    fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(atUri)}&depth=0`)
      .then(r => r.json())
      .then(data => {
        const post = data.thread?.post
        if (!post) return
        let image: string | null = null
        const embed = post.embed
        if (embed) {
          if (embed.$type === "app.bsky.embed.images#view") {
            image = embed.images?.[0]?.thumb ?? null
          } else if (embed.$type === "app.bsky.embed.video#view") {
            image = embed.thumbnail ?? null
          } else if (embed.$type === "app.bsky.embed.external#view") {
            image = embed.external?.thumb ?? null
          } else if (embed.$type === "app.bsky.embed.recordWithMedia#view") {
            const media = embed.media
            if (media?.$type === "app.bsky.embed.images#view") {
              image = media.images?.[0]?.thumb ?? null
            } else if (media?.$type === "app.bsky.embed.video#view") {
              image = media.thumbnail ?? null
            } else if (media?.$type === "app.bsky.embed.external#view") {
              image = media.external?.thumb ?? null
            }
          }
        }
        setMeta({
          title: post.author.displayName ?? `@${post.author.handle}`,
          image,
          description: post.record?.text ?? null,
        })
      })
      .catch(() => {})
  }, [handle, rkey])
  return meta
}

// Bluesky butterfly logo
const BlueskyLogo = () => (
  <svg viewBox="0 0 64 57" className="h-4 w-4" fill="#0085FF" aria-hidden="true">
    <path d="M13.873 3.93C19.218 8.184 24.971 16.834 32 20.865c7.03-4.031 12.782-12.681 18.127-16.935C54.25.075 64-1.986 64 9.816c0 2.248-.914 18.896-1.45 21.59-1.858 9.25-8.638 11.61-14.643 10.184 10.52 2.089 13.199 9.023 7.421 15.958C43.908 67.01 39.83 57.774 32 55.86c-7.83 1.914-11.908 11.15-23.328-1.312C3.2 47.613 5.879 40.68 16.399 38.59 10.394 40.016 3.614 37.657 1.756 28.406 1.22 25.712.306 9.064.306 6.816.306-4.986 10.056.075 13.873 3.93Z" />
  </svg>
)

// ── Shared card ────────────────────────────────────────

interface PostMeta {
  title: string | null
  image: string | null
  description: string | null
}

function SocialPostCard({
  href,
  fallbackAuthor,
  logo,
  meta,
}: {
  href: string
  fallbackAuthor: string
  logo: React.ReactNode
  meta: PostMeta | null
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 block w-full overflow-hidden rounded-xl border border-quiet-border bg-quiet-offwhite transition-colors hover:bg-quiet-border/30"
    >
      {meta?.image && (
        <img src={meta.image} alt="" className="w-full max-h-72 object-cover" />
      )}
      <div className="px-3 py-2.5 space-y-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0 text-quiet-muted">{logo}</div>
          <p className="text-xs font-semibold text-quiet-slate truncate min-w-0 flex-1">
            {meta?.title ?? fallbackAuthor}
          </p>
          <ExternalLink className="h-3 w-3 shrink-0 text-quiet-muted" />
        </div>
        {meta?.description && (
          <p className="text-sm text-quiet-slate leading-snug line-clamp-4 break-words">
            {meta.description}
          </p>
        )}
      </div>
    </a>
  )
}

function useSocialPostMeta(canonicalUrl: string | null): PostMeta | null {
  const [meta, setMeta] = useState<PostMeta | null>(null)
  useEffect(() => {
    if (!canonicalUrl) return
    fetch(`https://api.microlink.io?url=${encodeURIComponent(canonicalUrl)}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === "success") {
          setMeta({
            title: data.data.title ?? null,
            image: data.data.image?.url ?? data.data.video?.thumbnailUrl ?? null,
            description: data.data.description ?? null,
          })
        }
      })
      .catch(() => {})
  }, [canonicalUrl])
  return meta
}

// ── Exported components ────────────────────────────────

export function XEmbed({ url }: { url: string }) {
  const parsed = parseXUrl(url)
  const meta = useSocialPostMeta(parsed?.canonicalUrl ?? null)
  if (!parsed) return null
  // X/Twitter's API is restricted — Microlink often returns X's promo images
  // or error-state images instead of actual tweet media, so we strip the image.
  const safeMeta = meta ? { ...meta, image: null } : null
  return (
    <SocialPostCard
      href={parsed.canonicalUrl}
      fallbackAuthor={`@${parsed.username} on X`}
      logo={<XLogo />}
      meta={safeMeta}
    />
  )
}

export function BlueskyEmbed({ url }: { url: string }) {
  const parsed = parseBlueskyUrl(url)
  const meta = useBlueskyMeta(parsed?.username ?? null, parsed?.rkey ?? null)
  if (!parsed) return null
  return (
    <SocialPostCard
      href={parsed.canonicalUrl}
      fallbackAuthor={`@${parsed.username}`}
      logo={<BlueskyLogo />}
      meta={meta}
    />
  )
}

interface BlueskyProfile {
  avatar: string | null
  displayName: string | null
  description: string | null
}

function useBlueskyProfile(handle: string | null): BlueskyProfile | null {
  const [profile, setProfile] = useState<BlueskyProfile | null>(null)
  useEffect(() => {
    if (!handle) return
    fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(handle)}`)
      .then(r => r.json())
      .then(data => {
        setProfile({
          avatar: data.avatar ?? null,
          displayName: data.displayName ?? null,
          description: data.description ?? null,
        })
      })
      .catch(() => {})
  }, [handle])
  return profile
}

export function BlueskyProfileEmbed({ url }: { url: string }) {
  let handle: string | null = null
  try {
    const u = new URL(url)
    const match = u.pathname.match(/^\/profile\/([^/]+)/)
    if (match) handle = match[1]
  } catch { /* invalid URL */ }

  const profile = useBlueskyProfile(handle)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex items-center gap-3 rounded-xl border border-quiet-border bg-quiet-offwhite p-3 transition-colors hover:bg-quiet-border/30"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden bg-quiet-border/50">
        {profile?.avatar
          ? <img src={profile.avatar} alt="" className="h-10 w-10 object-cover" />
          : <BlueskyLogo />
        }
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <BlueskyLogo />
          <p className="truncate text-sm font-medium text-quiet-slate">
            {profile?.displayName ?? (handle ? `@${handle}` : url)}
          </p>
        </div>
        {profile?.description && (
          <p className="truncate text-xs text-quiet-muted">{profile.description}</p>
        )}
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-quiet-muted" />
    </a>
  )
}

// ── Reddit ────────────────────────────────────────────

export function isRedditPostUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, "")
    return (host === "reddit.com" || host === "old.reddit.com") &&
      /^\/r\/[^/]+\/comments\/[a-z0-9]+/.test(u.pathname)
  } catch { /* invalid URL */ }
  return false
}

const RedditLogo = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="#FF4500" aria-hidden="true">
    <path d="M10 0C4.478 0 0 4.478 0 10c0 5.523 4.478 10 10 10 5.523 0 10-4.477 10-10C20 4.478 15.523 0 10 0zm5.838 10.126a1.42 1.42 0 01-.589 1.146c.031.2.047.403.047.608 0 3.112-3.627 5.642-8.099 5.642-4.47 0-8.097-2.53-8.097-5.642 0-.204.016-.408.047-.607a1.42 1.42 0 01-.589-1.147 1.421 1.421 0 012.84 0c.003.256-.06.508-.186.73 1.245-.867 2.93-1.42 4.818-1.485l.816-3.847a.18.18 0 01.212-.136l2.71.567a.984.984 0 111.908.463.985.985 0 01-.984.984.986.986 0 01-.982-.947l-2.427-.508-.734 3.455c1.864.079 3.525.63 4.757 1.49a1.42 1.42 0 012.315 1.233zm-9.094 2.3a.984.984 0 100-1.967.984.984 0 000 1.967zm4.994 2.652a2.587 2.587 0 01-3.276 0 .18.18 0 00-.254.254 2.943 2.943 0 003.783 0 .181.181 0 00-.253-.254zm.284-1.668a.985.985 0 100-1.969.985.985 0 000 1.969z" />
  </svg>
)

export function RedditEmbed({ url }: { url: string }) {
  let subreddit = "reddit"
  try {
    const u = new URL(url)
    const match = u.pathname.match(/^\/r\/([^/]+)/)
    if (match) subreddit = match[1]
  } catch { /* invalid URL */ }

  const meta = useSocialPostMeta(url)
  return (
    <SocialPostCard
      href={url}
      fallbackAuthor={`r/${subreddit}`}
      logo={<RedditLogo />}
      meta={meta}
    />
  )
}
