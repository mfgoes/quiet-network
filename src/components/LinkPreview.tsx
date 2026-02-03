import { useState, useMemo } from "react"
import { ExternalLink } from "lucide-react"
import { YouTubeEmbed, extractYouTubeId } from "@/components/YouTubeEmbed"
import { GoogleMapsEmbed, GoogleMapsLinkCard, extractMapCoords, isGoogleMapsUrl } from "@/components/GoogleMapsEmbed"

interface LinkPreviewProps {
  url: string
}

const IMAGE_RE = /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)(\?.*)?$/i

export function LinkPreview({ url }: LinkPreviewProps) {
  const [faviconError, setFaviconError] = useState(false)
  const [imgError, setImgError] = useState(false)

  const youtubeId = useMemo(() => extractYouTubeId(url), [url])
  const mapCoords = useMemo(() => extractMapCoords(url), [url])

  if (youtubeId) {
    return <YouTubeEmbed videoId={youtubeId} />
  }

  const isMapsLink = useMemo(() => isGoogleMapsUrl(url), [url])

  if (mapCoords) {
    return <GoogleMapsEmbed url={url} lat={mapCoords.lat} lng={mapCoords.lng} />
  }

  if (isMapsLink) {
    return <GoogleMapsLinkCard url={url} />
  }
  const isImage = IMAGE_RE.test(url) && !imgError

  let domain: string
  try {
    domain = new URL(url).hostname
  } catch {
    domain = url
  }

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

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex items-center gap-3 rounded-lg border border-quiet-border bg-quiet-offwhite p-3 transition-colors hover:bg-quiet-border/30"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-quiet-border/50">
        {faviconError ? (
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
          {displayDomain}
        </p>
        <p className="truncate text-xs text-quiet-muted">
          {truncatedUrl}
        </p>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-quiet-muted" />
    </a>
  )
}
