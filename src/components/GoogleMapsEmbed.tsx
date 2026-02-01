import { useState, useMemo } from "react"
import { MapPin, Navigation } from "lucide-react"

interface GoogleMapsEmbedProps {
  url: string
  lat: number
  lng: number
}

/** Google Maps pin SVG used as a brand badge. */
function GoogleMapsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 92.3 132.3" className={className} aria-hidden="true">
      <path
        fill="#1a73e8"
        d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"
      />
      <path
        fill="#ea4335"
        d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3L10.8 16.5z"
      />
      <path
        fill="#4285f4"
        d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.6-6.3"
      />
      <path
        fill="#fbbc04"
        d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3"
      />
      <path
        fill="#34a853"
        d="M59.1 109.2c15.4-24.1 33.3-35 33.3-63 0-7.7-1.9-14.9-5.2-21.3L25.6 98c2.6 3.4 5.3 7.3 7.9 11.3 9.4 14.5 6.8 23.1 12.8 23.1s3.4-8.7 12.8-23.2"
      />
    </svg>
  )
}

export function GoogleMapsEmbed({ url, lat, lng }: GoogleMapsEmbedProps) {
  const [active, setActive] = useState(false)
  const [thumbError, setThumbError] = useState(false)

  const placeName = useMemo(() => extractPlaceName(url), [url])
  const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=16&size=400x400&maptype=osmarenderer&markers=${lat},${lng},red-pushpin`
  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`

  if (active) {
    return (
      <div className="mt-3 overflow-hidden rounded-lg border border-quiet-border">
        <div className="relative w-full" style={{ paddingBottom: "50%" }}>
          <iframe
            src={embedUrl}
            title="Google Maps"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full"
            style={{ border: "none" }}
          />
        </div>
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex overflow-hidden rounded-lg border border-quiet-border bg-white text-left transition-colors hover:bg-quiet-offwhite"
    >
      {/* Square map thumbnail */}
      <div className="relative h-20 w-20 shrink-0">
        {thumbError ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
            <MapPin className="h-7 w-7 text-red-500" />
          </div>
        ) : (
          <img
            src={staticMapUrl}
            alt="Map preview"
            className="h-full w-full object-cover"
            onError={() => setThumbError(true)}
          />
        )}
      </div>

      {/* Place info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
        {placeName && (
          <p className="truncate text-sm font-semibold text-quiet-slate">
            {placeName}
          </p>
        )}
        <p className="mt-0.5 truncate text-xs text-quiet-muted">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <GoogleMapsIcon className="h-4 w-4" />
          <span className="text-xs font-medium text-[#1a73e8]">
            Open in Google Maps
          </span>
          <Navigation className="h-3 w-3 text-[#1a73e8]" />
        </div>
      </div>
    </a>
  )
}

/**
 * Extract a human-readable place name from a Google Maps URL.
 * URLs like /maps/place/The+Red+Lion/... contain the name in the path.
 */
function extractPlaceName(url: string): string | null {
  try {
    const u = new URL(url)
    // Pattern: /place/Place+Name/@...
    const placeMatch = u.pathname.match(/\/place\/([^/@]+)/)
    if (placeMatch) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, " "))
    }
    // Pattern: ?q=Place+Name (non-coordinate query)
    const q = u.searchParams.get("q")
    if (q && !/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(q)) {
      return decodeURIComponent(q.replace(/\+/g, " "))
    }
  } catch {
    // invalid URL
  }
  return null
}

/**
 * Extract latitude and longitude from a Google Maps URL.
 * Returns null for shortened URLs (maps.app.goo.gl) since
 * coordinates can't be resolved client-side.
 */
export function extractMapCoords(
  url: string
): { lat: number; lng: number } | null {
  try {
    const u = new URL(url)
    const host = u.hostname

    const isGoogleMaps =
      host === "maps.google.com" ||
      /^(www\.)?google\.[a-z.]+$/.test(host)

    if (!isGoogleMaps) return null

    // Pattern: /@lat,lng or /@lat,lng,zoom
    const atMatch = u.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) }
    }

    // Pattern: ?q=lat,lng
    const q = u.searchParams.get("q")
    if (q) {
      const qMatch = q.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/)
      if (qMatch) {
        return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) }
      }
    }

    // Pattern: ?ll=lat,lng
    const ll = u.searchParams.get("ll")
    if (ll) {
      const llMatch = ll.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/)
      if (llMatch) {
        return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) }
      }
    }
  } catch {
    // invalid URL
  }
  return null
}

/** Fallback card for shortened Google Maps URLs where we can't extract coords. */
export function GoogleMapsLinkCard({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex overflow-hidden rounded-lg border border-quiet-border bg-white text-left transition-colors hover:bg-quiet-offwhite"
    >
      <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <MapPin className="h-6 w-6 text-red-500" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
        <p className="text-sm font-semibold text-quiet-slate">
          Shared location
        </p>
        <p className="mt-0.5 truncate text-xs text-quiet-muted">
          Tap to view in Google Maps
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <GoogleMapsIcon className="h-4 w-4" />
          <span className="text-xs font-medium text-[#1a73e8]">
            Open in Google Maps
          </span>
          <Navigation className="h-3 w-3 text-[#1a73e8]" />
        </div>
      </div>
    </a>
  )
}

/** Check if a URL is any kind of Google Maps link (including shortened). */
export function isGoogleMapsUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return (
      host === "maps.app.goo.gl" ||
      host === "goo.gl" ||
      host === "maps.google.com" ||
      (/^(www\.)?google\.[a-z.]+$/.test(host) && url.includes("/maps"))
    )
  } catch {
    return false
  }
}
