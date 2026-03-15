import { useState, useMemo, useEffect } from "react"
import { ExternalLink } from "lucide-react"
import { YouTubeEmbed, extractYouTubeId } from "@/components/YouTubeEmbed"
import { GoogleMapsEmbed, GoogleMapsLinkCard, extractMapCoords, isGoogleMapsUrl } from "@/components/GoogleMapsEmbed"
import { XEmbed, isXTweetUrl, BlueskyEmbed, isBlueskyUrl, isRedditPostUrl, RedditEmbed } from "@/components/XEmbed"

interface LinkPreviewProps {
  url: string
}

const IMAGE_RE = /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)(\?.*)?$/i

/** Hard-cap a string and strip newlines so it can never blow out a single-line layout. */
function clip(s: string | null | undefined, max: number): string | null {
  if (!s) return null
  const flat = s.replace(/\s+/g, " ").trim()
  return flat.length > max ? flat.slice(0, max) + "…" : flat
}

// Social platform detection + branded icons
type SocialPlatform = "instagram" | "facebook" | "tiktok" | "linkedin"

const socialMap: Record<string, SocialPlatform> = {
  "instagram.com": "instagram",
  "facebook.com": "facebook",
  "fb.com": "facebook",
  "fb.watch": "facebook",
  "tiktok.com": "tiktok",
  "linkedin.com": "linkedin",
}

const socialColors: Record<SocialPlatform, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  tiktok: "#010101",
  linkedin: "#0A66C2",
}

const socialInitials: Record<SocialPlatform, string> = {
  instagram: "IG",
  facebook: "fb",
  tiktok: "TT",
  linkedin: "in",
}

function detectSocial(hostname: string): SocialPlatform | null {
  return socialMap[hostname.replace(/^www\./, "")] ?? null
}


interface LinkMeta {
  title: string | null
  description: string | null
}

function useLinkMeta(url: string, enabled: boolean): LinkMeta | null {
  const [meta, setMeta] = useState<LinkMeta | null>(null)
  useEffect(() => {
    if (!enabled) return
    fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          setMeta({
            title: data.data.title ?? null,
            description: data.data.description ?? null,
          })
        }
      })
      .catch(() => {})
  }, [url, enabled])
  return meta
}

export function LinkPreview({ url }: LinkPreviewProps) {
  const [faviconError, setFaviconError] = useState(false)
  const [imgError, setImgError] = useState(false)

  const youtubeId = useMemo(() => extractYouTubeId(url), [url])
  const mapCoords = useMemo(() => extractMapCoords(url), [url])
  const isTweet = useMemo(() => isXTweetUrl(url), [url])
  const isBluesky = useMemo(() => isBlueskyUrl(url), [url])
  const isReddit = useMemo(() => isRedditPostUrl(url), [url])
  const isMapsLink = useMemo(() => isGoogleMapsUrl(url), [url])

  let domain: string
  try {
    domain = new URL(url).hostname
  } catch {
    domain = url
  }

  const socialPlatform = useMemo(() => detectSocial(domain), [domain])
  const social = socialPlatform !== null
  const meta = useLinkMeta(url, social)

  if (youtubeId) {
    return <YouTubeEmbed videoId={youtubeId} />
  }

  if (isTweet) {
    return <XEmbed url={url} />
  }

  if (isBluesky) {
    return <BlueskyEmbed url={url} />
  }

  if (isReddit) {
    return <RedditEmbed url={url} />
  }

  if (mapCoords) {
    return <GoogleMapsEmbed url={url} lat={mapCoords.lat} lng={mapCoords.lng} />
  }

  if (isMapsLink) {
    return <GoogleMapsLinkCard url={url} />
  }

  const isImage = IMAGE_RE.test(url) && !imgError
  const displayDomain = domain.replace(/^www\./, "")
  const truncatedUrl =
    url.length > 60 ? url.slice(0, 57) + "..." : url
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

  if (isImage) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block overflow-hidden rounded-lg border border-quiet-border bg-quiet-offwhite transition-colors hover:bg-quiet-border/30"
      >
        <img
          src={url}
          alt=""
          className="w-full max-h-80 object-cover"
          onError={() => setImgError(true)}
        />
        <div className="flex items-center gap-2 px-3 py-2">
          <p className="truncate text-xs text-quiet-muted flex-1">
            {displayDomain}
          </p>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-quiet-muted" />
        </div>
      </a>
    )
  }

  // Same card for everything — social URLs just get a richer title/description from Microlink
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex items-center gap-3 rounded-lg border border-quiet-border bg-quiet-offwhite p-3 transition-colors hover:bg-quiet-border/30"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-quiet-border/50">
        {socialPlatform ? (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-white"
            style={{ backgroundColor: socialColors[socialPlatform] }}
          >
            {socialInitials[socialPlatform]}
          </span>
        ) : faviconError ? (
          <ExternalLink className="h-5 w-5 text-quiet-muted" />
        ) : (
          <img
            src={faviconUrl}
            alt=""
            className="h-6 w-6 rounded-sm"
            onError={() => setFaviconError(true)}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-quiet-slate">
          {clip(meta?.title, 80) ?? displayDomain}
        </p>
        <p className="truncate text-xs text-quiet-muted">
          {clip(meta?.description, 100) ?? truncatedUrl}
        </p>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-quiet-muted" />
    </a>
  )
}
