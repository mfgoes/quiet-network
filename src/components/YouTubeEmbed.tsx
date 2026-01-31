import { useState } from "react"
import { Play } from "lucide-react"

interface YouTubeEmbedProps {
  videoId: string
}

export function YouTubeEmbed({ videoId }: YouTubeEmbedProps) {
  const [playing, setPlaying] = useState(false)

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

  if (playing) {
    return (
      <div className="mt-3 overflow-hidden rounded-lg border border-quiet-border">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`}
            title="YouTube video"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
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
      onClick={() => setPlaying(true)}
      className="mt-3 block w-full overflow-hidden rounded-lg border border-quiet-border bg-black text-left"
    >
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <img
          src={thumbnailUrl}
          alt="YouTube video thumbnail"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/70 text-white transition-transform hover:scale-110">
            <Play className="h-7 w-7 fill-current" />
          </div>
        </div>
      </div>
    </button>
  )
}

/** Extract a YouTube video ID from a URL, or return null. */
export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1).split("/")[0] || null
    }
    if (
      u.hostname === "www.youtube.com" ||
      u.hostname === "youtube.com" ||
      u.hostname === "m.youtube.com"
    ) {
      if (u.pathname === "/watch") {
        return u.searchParams.get("v")
      }
      const shorts = u.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)/)
      if (shorts) return shorts[1]
      const embed = u.pathname.match(/^\/embed\/([a-zA-Z0-9_-]+)/)
      if (embed) return embed[1]
    }
  } catch {
    // invalid URL
  }
  return null
}
