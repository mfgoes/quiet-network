import { ExternalLink } from "lucide-react"

type Platform =
  | "bluesky"
  | "instagram"
  | "github"
  | "x"
  | "linkedin"
  | "tiktok"
  | "mastodon"
  | "twitch"
  | "patreon"

const PLATFORM_MATCHERS: { platform: Platform; test: (url: string) => boolean }[] = [
  { platform: "bluesky", test: (u) => u.includes("bsky.app") || u.includes("bsky.social") },
  { platform: "instagram", test: (u) => u.includes("instagram.com") },
  { platform: "github", test: (u) => u.includes("github.com") },
  { platform: "x", test: (u) => u.includes("x.com") || u.includes("twitter.com") },
  { platform: "linkedin", test: (u) => u.includes("linkedin.com") },
  { platform: "tiktok", test: (u) => u.includes("tiktok.com") },
  { platform: "mastodon", test: (u) => /mastodon\.|mstdn\.|fosstodon\.|hachyderm\.|social\./i.test(u) },
  { platform: "twitch", test: (u) => u.includes("twitch.tv") },
  { platform: "patreon", test: (u) => u.includes("patreon.com") },
]

export function detectPlatform(url: string): Platform | null {
  const lower = url.toLowerCase()
  for (const m of PLATFORM_MATCHERS) {
    if (m.test(lower)) return m.platform
  }
  return null
}

const iconClass = "h-4 w-4 shrink-0"

// Simple inline SVG icons for each platform
const ICONS: Record<Platform, React.ReactNode> = {
  bluesky: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.5 7 3.5 11 3.5 13.5c0 2.5 2 3.5 3.5 3.5 1 0 2-.5 2-.5S8.5 18 7 18c-2 0-3.5 1.5-3.5 1.5S5 22 8.5 22c4 0 7-3 7-3s3 3 7 3c3.5 0 5-2.5 5-2.5S26 18 24 18c-1.5 0-2 1.5-2 1.5s1 .5 2 .5c1.5 0 3.5-1 3.5-3.5C27.5 11 24.5 7 19 2c-3.5 3-5.5 6-7 8-1.5-2-3.5-5-7-8z" />
    </svg>
  ),
  instagram: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  github: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.17c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12.01 12.01 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  ),
  x: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  linkedin: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 11-.01-4.13 2.06 2.06 0 01.01 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0z" />
    </svg>
  ),
  tiktok: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.22 6.22 0 00-.79-.05 6.28 6.28 0 00-6.28 6.28 6.28 6.28 0 006.28 6.28 6.28 6.28 0 006.28-6.28V8.99a8.18 8.18 0 004.78 1.53V7.08a4.84 4.84 0 01-1.96-.39z" />
    </svg>
  ),
  mastodon: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.27 8.01c-.35-2.39-2.6-4.3-5.23-4.76C17.48 3.14 15.03 3 12.01 3h-.03c-3.02 0-3.67.14-4.23.25-2.6.47-4.88 2.37-5.23 4.76-.17 1.18-.19 2.49-.14 3.72.06 1.82.08 3.64.24 5.45.12 1.24.36 2.46.77 3.63.74 2.12 3.74 3.89 6.37 4.36 2.78.5 5.24.37 7.18-.29.22-.07.43-.16.63-.26l-.01-.7a.7.7 0 00-.68-.69c-.24 0-1.73.44-3.52.35-1.77-.09-3.65-.28-3.95-3.49a4.4 4.4 0 01-.04-.63s1.77.43 4.02.53c1.37.07 2.66-.08 3.97-.24 2.51-.31 4.69-1.9 4.97-3.35.44-2.27.4-5.54.4-5.54zM19.32 14h-2.28V8.7c0-1.13-.47-1.7-1.42-1.7-1.05 0-1.57.68-1.57 2.02V11.52H11.78V8.97c0-1.34-.53-2.02-1.57-2.02-.95 0-1.42.57-1.42 1.7V14H6.51V8.5c0-1.13.29-2.03.87-2.7.6-.67 1.38-1.01 2.36-1.01 1.13 0 1.98.43 2.54 1.3l.55.92.55-.92c.56-.87 1.42-1.3 2.54-1.3.98 0 1.77.34 2.36 1.01.58.67.87 1.57.87 2.7V14z" />
    </svg>
  ),
  twitch: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M4.5 0L1.5 3v18h5.36V24l3-3h2.57L19.5 14.07V0m-1.43 13.07l-2.57 2.57h-3l-2.25 2.25v-2.25H6.43V1.43h11.64z" />
    </svg>
  ),
  patreon: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.39 3.03c-3.9 0-7.06 3.15-7.06 7.04 0 3.87 3.16 7.01 7.06 7.01 3.88 0 7.03-3.14 7.03-7.01 0-3.89-3.15-7.04-7.03-7.04zM1.58 20.97h3.72V3.03H1.58z" />
    </svg>
  ),
}

export function SocialIcon({ url }: { url: string }) {
  const platform = detectPlatform(url)
  if (platform) return <>{ICONS[platform]}</>
  return <ExternalLink className={iconClass} />
}
