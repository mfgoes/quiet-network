'use client'

import { useState, useMemo, useEffect } from "react"
import { ExternalLink } from "lucide-react"
import { YouTubeEmbed, extractYouTubeId } from "@/components/YouTubeEmbed"
import { GoogleMapsEmbed, GoogleMapsLinkCard, extractMapCoords, isGoogleMapsUrl } from "@/components/GoogleMapsEmbed"
import { XEmbed, isXTweetUrl, BlueskyEmbed, isBlueskyUrl, isBlueskyProfileUrl, BlueskyProfileEmbed, isRedditPostUrl, RedditEmbed } from "@/components/XEmbed"

interface LinkPreviewProps {
  url: string
}

const IMAGE_RE = /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)(\?.*)?$/i
const VIDEO_RE = /\.(mp4|webm|mov|ogg)(\?.*)?$/i
// Hosts that always serve images even without a file extension
const IMAGE_HOSTS = ["i.imgur.com", "i.redd.it", "pbs.twimg.com"]

/** Returns the video src to use, or null if not a video URL. Handles imgur .gifv → .mp4. */
function detectVideoUrl(url: string): string | null {
  if (/imgur\.com/.test(url) && url.endsWith(".gifv")) return url.replace(".gifv", ".mp4")
  if (VIDEO_RE.test(url)) return url
  return null
}

/** Hard-cap a string and strip newlines so it can never blow out a single-line layout. */
function clip(s: string | null | undefined, max: number): string | null {
  if (!s) return null
  const flat = s.replace(/\s+/g, " ").trim()
  return flat.length > max ? flat.slice(0, max) + "…" : flat
}

// Social platform detection + branded icons
type SocialPlatform = "instagram" | "facebook" | "tiktok" | "linkedin" | "itch" | "soundcloud" | "bandcamp" | "github" | "spotify"

const socialMap: Record<string, SocialPlatform> = {
  "instagram.com": "instagram",
  "facebook.com": "facebook",
  "fb.com": "facebook",
  "fb.watch": "facebook",
  "tiktok.com": "tiktok",
  "linkedin.com": "linkedin",
  "itch.io": "itch",
  "soundcloud.com": "soundcloud",
  "bandcamp.com": "bandcamp",
  "github.com": "github",
  "open.spotify.com": "spotify",
  "spotify.com": "spotify",
}

const socialColors: Record<SocialPlatform, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  tiktok: "#010101",
  linkedin: "#0A66C2",
  itch: "#FA5C5C",
  soundcloud: "#FF5500",
  bandcamp: "#1DA0C3",
  github: "#24292e",
  spotify: "#1DB954",
}

const socialInitials: Record<SocialPlatform, string> = {
  instagram: "IG",
  facebook: "fb",
  tiktok: "TT",
  linkedin: "in",
  itch: "i",
  soundcloud: "SC",
  bandcamp: "BC",
  github: "gh",
  spotify: "S",
}

function detectSocial(hostname: string): SocialPlatform | null {
  const host = hostname.replace(/^www\./, "")
  if (socialMap[host]) return socialMap[host]
  // Match subdomains: mischa.itch.io → itch.io, artist.bandcamp.com → bandcamp.com
  const apex = host.split(".").slice(-2).join(".")
  return socialMap[apex] ?? null
}


interface LinkMeta {
  title: string | null
  description: string | null
  image: string | null
}

function useLinkMeta(url: string): LinkMeta | null {
  const [meta, setMeta] = useState<LinkMeta | null>(null)
  useEffect(() => {
    fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          setMeta({
            title: data.data.title ?? null,
            description: data.data.description ?? null,
            image: data.data.image?.url ?? null,
          })
        }
      })
      .catch(() => {})
  }, [url])
  return meta
}

export function LinkPreview({ url }: LinkPreviewProps) {
  const [faviconError, setFaviconError] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [ogImgError, setOgImgError] = useState(false)

  const videoSrc = useMemo(() => detectVideoUrl(url), [url])
  const youtubeId = useMemo(() => extractYouTubeId(url), [url])
  const mapCoords = useMemo(() => extractMapCoords(url), [url])
  const isTweet = useMemo(() => isXTweetUrl(url), [url])
  const isBluesky = useMemo(() => isBlueskyUrl(url), [url])
  const isBlueskyProfile = useMemo(() => isBlueskyProfileUrl(url), [url])
  const isReddit = useMemo(() => isRedditPostUrl(url), [url])
  const isMapsLink = useMemo(() => isGoogleMapsUrl(url), [url])

  let domain: string
  try {
    domain = new URL(url).hostname
  } catch {
    domain = url
  }

  const socialPlatform = useMemo(() => detectSocial(domain), [domain])
  const meta = useLinkMeta(url)

  if (videoSrc) {
    return (
      <div className="mt-3 overflow-hidden rounded-lg border border-quiet-border bg-black">
        <video
          src={videoSrc}
          controls
          className="w-full max-h-96"
          preload="metadata"
        />
      </div>
    )
  }

  if (youtubeId) {
    return <YouTubeEmbed videoId={youtubeId} />
  }

  if (isTweet) {
    return <XEmbed url={url} />
  }

  if (isBluesky) {
    return <BlueskyEmbed url={url} />
  }

  if (isBlueskyProfile) {
    return <BlueskyProfileEmbed url={url} />
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

  const isImage = !videoSrc && (IMAGE_RE.test(url) || IMAGE_HOSTS.includes(domain)) && !imgError
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

  const showOgImage = !socialPlatform && meta?.image && !ogImgError

  // Same card for everything — URLs get richer title/description/thumbnail from Microlink
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex items-center gap-3 rounded-lg border border-quiet-border bg-quiet-offwhite p-3 transition-colors hover:bg-quiet-border/30"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-quiet-border/50 overflow-hidden">
        {socialPlatform ? (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-white"
            style={{ backgroundColor: socialColors[socialPlatform] }}
          >
            {socialInitials[socialPlatform]}
          </span>
        ) : showOgImage ? (
          <img
            src={meta!.image!}
            alt=""
            className="h-10 w-10 object-cover"
            onError={() => setOgImgError(true)}
          />
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
