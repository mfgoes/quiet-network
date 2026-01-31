import { useState } from "react"
import { MapPin } from "lucide-react"

interface GoogleMapsEmbedProps {
  url: string
  lat: number
  lng: number
}

export function GoogleMapsEmbed({ url, lat, lng }: GoogleMapsEmbedProps) {
  const [active, setActive] = useState(false)
  const [thumbError, setThumbError] = useState(false)

  const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=600x300&maptype=osmarenderer&markers=${lat},${lng},red-pushpin`
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
    <button
      type="button"
      onClick={() => setActive(true)}
      className="mt-3 block w-full overflow-hidden rounded-lg border border-quiet-border bg-quiet-offwhite text-left"
    >
      <div className="relative w-full" style={{ paddingBottom: "50%" }}>
        {thumbError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100">
            <MapPin className="h-8 w-8 text-red-500" />
            <p className="mt-1 text-xs text-quiet-muted">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>
          </div>
        ) : (
          <img
            src={staticMapUrl}
            alt="Map preview"
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setThumbError(true)}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors hover:bg-black/20">
          <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-quiet-slate shadow-sm">
            <MapPin className="h-4 w-4 text-red-500" />
            View on map
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2">
        <p className="truncate text-xs text-quiet-muted flex-1">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-blue-600 hover:underline"
        >
          Open in Google Maps
        </a>
      </div>
    </button>
  )
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
      host === "www.google.com" ||
      host === "google.com" ||
      host === "maps.google.com" ||
      host === "www.google.nl" ||
      host === "google.nl"

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

/** Check if a URL is any kind of Google Maps link (including shortened). */
export function isGoogleMapsUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return (
      host === "maps.app.goo.gl" ||
      host === "goo.gl" ||
      host === "maps.google.com" ||
      ((host === "www.google.com" || host === "google.com" ||
        host === "www.google.nl" || host === "google.nl") &&
        url.includes("/maps"))
    )
  } catch {
    return false
  }
}
