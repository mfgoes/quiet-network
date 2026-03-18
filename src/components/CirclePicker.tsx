import { useState, useMemo, useCallback } from "react"
import { AlertCircle, List, Map, MapPin, Plus, Search, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CircleIcon } from "@/components/CircleIcon"
import { CircleMap } from "@/components/CircleMap"
import { useCircleMemberCounts, useCircleLatestPosts } from "@/lib/hooks"
import { getBannerBg, getBannerGradient, isBannerDark } from "@/types"
import type { Circle } from "@/types"

const COUNTRY_LABELS: Record<string, string> = {
  NL: "the Netherlands",
  BE: "Belgium",
  DE: "Germany",
  FR: "France",
  GB: "the UK",
  US: "the US",
  ID: "Indonesia",
  OTHER: "your area",
}

/** Maps lowercase search terms → ISO country code */
export const COUNTRY_ALIASES: Record<string, string> = {
  // Netherlands
  nl: "NL", netherlands: "NL", nederland: "NL", holland: "NL",
  // Belgium
  be: "BE", belgium: "BE", belgië: "BE", belgie: "BE", belgique: "BE",
  // Germany
  de: "DE", germany: "DE", deutschland: "DE",
  // France
  fr: "FR", france: "FR",
  // UK
  gb: "GB", uk: "GB", "united kingdom": "GB", britain: "GB", england: "GB",
  // US
  us: "US", usa: "US", america: "US", "united states": "US",
  // Indonesia
  id: "ID", indonesia: "ID",
}

export function resolveCountryCode(q: string): string | null {
  return COUNTRY_ALIASES[q.trim().toLowerCase()] ?? null
}

// ─── Circle identity card ─────────────────────────────

function CircleCard({
  circle,
  isMember,
  joiningId,
  memberCount,
  latestPost,
  onSelect,
  onJoin,
}: {
  circle: Circle
  isMember: boolean
  joiningId: string | null
  memberCount?: number
  latestPost?: string
  onSelect: (c: Circle) => void
  onJoin: (c: Circle) => Promise<void>
}) {
  const accent      = getBannerBg(circle.banner_color, circle.name)
  const gradient    = getBannerGradient(circle.banner_color, circle.name)
  const dark        = isBannerDark(circle.banner_color)
  const nameColor   = dark ? "#f8fafc" : undefined
  const mutedColor  = dark ? "#cbd5e1" : undefined
  const actionColor = dark ? "#94a3b8" : "#667eea"
  const detail      = circle.about || circle.description

  return (
    <div className="group relative group-hover:z-[1000]" style={{ isolation: "isolate" }}>
      {/* Hover tooltip */}
      <div className="pointer-events-none absolute bottom-full left-0 right-0 z-[1000] mb-2 hidden group-hover:block">
        <div className="rounded-xl border border-quiet-border bg-white shadow-lg p-3 text-left animate-in fade-in zoom-in-95 duration-150">
          {memberCount !== undefined && (
            <div className="flex items-center gap-1 mb-2">
              <Users className="h-3 w-3 text-quiet-muted" />
              <span className="text-xs font-medium text-quiet-slate">
                {memberCount.toLocaleString()} {memberCount === 1 ? "member" : "members"}
              </span>
            </div>
          )}
          {detail && (
            <p className="text-xs text-quiet-muted leading-relaxed mb-2">{detail}</p>
          )}
          {latestPost && (
            <div>
              <p className="text-[0.65rem] font-medium uppercase tracking-wide text-quiet-muted/60 mb-1">Latest post</p>
              <p className="text-xs text-quiet-muted leading-relaxed line-clamp-3">
                {latestPost.replace(/<[^>]+>/g, " ").trim()}
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => isMember ? onSelect(circle) : onJoin(circle)}
        disabled={joiningId === circle.id}
        className="relative rounded-xl border overflow-hidden text-left w-full transition-all hover:shadow-md hover:-translate-y-px active:translate-y-0 disabled:opacity-60"
        style={{ borderColor: `${accent}66` }}
      >
        {/* Tinted identity area */}
        <div className="p-3.5 pb-3" style={{ background: gradient }}>
          <div className="flex items-start gap-3">
            <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="xl" />
            <div className="min-w-0 flex-1 pt-0.5">
              <div
                className="font-semibold text-[0.82rem] leading-snug text-quiet-slate"
                style={nameColor ? { color: nameColor } : undefined}
              >
                {circle.name}
              </div>
              {(circle.description || circle.about) && (
                <div
                  className="text-[0.72rem] mt-0.5 leading-relaxed line-clamp-2 text-quiet-muted"
                  style={mutedColor ? { color: mutedColor } : undefined}
                >
                  {circle.description || circle.about}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Clean action footer */}
        <div className="bg-white px-3.5 py-2 border-t border-quiet-border/60">
          <span
            className="text-[0.7rem] font-semibold tracking-wide"
            style={{ color: actionColor }}
          >
            {joiningId === circle.id ? "Joining…" : isMember ? "View →" : "Join →"}
          </span>
        </div>
      </button>
    </div>
  )
}

interface CirclePickerProps {
  circles: Circle[]
  discoverableCircles: Circle[]
  userCountry: string | null
  loading: boolean
  userLocation?: { lat: number; lng: number } | null
  onSelect: (circle: Circle) => void
  onCreate: (name: string, description?: string) => Promise<void>
  onJoin: (circle: Circle) => Promise<void>
  onSetLocation: () => void
}

export function CirclePicker({
  circles,
  discoverableCircles,
  userCountry,
  loading,
  userLocation,
  onSelect,
  onCreate,
  onJoin,
  onSetLocation,
}: CirclePickerProps) {
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"list" | "map">("list")
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [showAllOwn, setShowAllOwn] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set())
  const onPinnedIds = useCallback((ids: Set<string>) => setPinnedIds(ids), [])

  const INITIAL_SHOW = 10

  // All circles deduped (for map)
  const allCircles = useMemo(() => {
    const seen = new Set<string>()
    return [...circles, ...discoverableCircles].filter(c => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
  }, [circles, discoverableCircles])

  const memberCounts = useCircleMemberCounts(allCircles.map(c => c.id))
  const latestPosts  = useCircleLatestPosts(allCircles.map(c => c.id))

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    const countryCode = resolveCountryCode(q)
    return allCircles.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q) ||
      (countryCode !== null && c.country === countryCode)
    )
  }, [query, allCircles])

  // Local = every circle (joined OR discoverable) matching the user's country
  const joinedIds = new Set(circles.map((c) => c.id))
  const localCircles = userCountry
    ? [...circles, ...discoverableCircles].filter((c) => c.country === userCountry)
    : []
  const otherCircles = userCountry
    ? discoverableCircles.filter((c) => c.country !== userCountry)
    : discoverableCircles

  const visibleCircles = showAllOwn ? circles : circles.slice(0, INITIAL_SHOW)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    await onCreate(name.trim(), description.trim() || undefined)
    setName("")
    setDescription("")
    setShowCreate(false)
    setCreating(false)
  }

  const handleSelect = useCallback((circle: Circle) => {
    setSelectedId(circle.id)
    setView("list")
    onSelect(circle)
  }, [onSelect])

  const handleJoin = useCallback(async (circle: Circle) => {
    setSelectedId(circle.id)
    setJoiningId(circle.id)
    await onJoin(circle)
    setJoiningId(null)
  }, [onJoin])

  if (loading) {
    return (
      <p className="text-center text-sm text-quiet-muted">
        Loading circles...
      </p>
    )
  }

  const countryLabel = userCountry ? (COUNTRY_LABELS[userCountry] ?? userCountry) : null

  // Unpinned circles = not yet resolved OR resolved to null (no location found)
  const unpinnedCircles = useMemo(
    () => allCircles.filter(c => !pinnedIds.has(c.id)),
    [allCircles, pinnedIds]
  )

  return (
    <div className="space-y-4">
      {/* Search bar + Map/List toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-quiet-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setView("list") }}
            placeholder="Search circles…"
            className="w-full rounded-lg border border-quiet-border bg-white py-2.5 pl-9 pr-9 text-sm text-quiet-slate placeholder:text-quiet-muted focus:outline-none focus:ring-1 focus:ring-quiet-accent"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-quiet-muted hover:text-quiet-slate">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Toggle */}
        <div className="flex items-center rounded-lg border border-quiet-border bg-white p-0.5 shrink-0">
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${view === "list" ? "bg-quiet-accent text-white" : "text-quiet-muted hover:text-quiet-slate"}`}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
          <button
            onClick={() => setView("map")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${view === "map" ? "bg-quiet-accent text-white" : "text-quiet-muted hover:text-quiet-slate"}`}
          >
            <Map className="h-3.5 w-3.5" />
            Map
          </button>
        </div>
      </div>

      {/* Map view */}
      {view === "map" && (
        <div className="space-y-4">
          <div style={{ height: 420 }}>
            <CircleMap
              circles={allCircles}
              selectedId={selectedId}
              joinedIds={new Set(circles.map(c => c.id))}
              userLocation={userLocation}
              onSelect={handleSelect}
              onJoin={handleJoin}
              onPinnedIds={onPinnedIds}
            />
          </div>
          {/* Circles without a map pin */}
          {unpinnedCircles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-quiet-muted">Not on the map</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {unpinnedCircles.map(circle => (
                  <CircleCard
                    key={circle.id}
                    circle={circle}
                    isMember={circles.some(c => c.id === circle.id)}
                    joiningId={joiningId}
                    memberCount={memberCounts[circle.id]}
                    latestPost={latestPosts[circle.id]}
                    onSelect={handleSelect}
                    onJoin={handleJoin}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {view === "list" && <>

      {/* Search results — replaces sectioned layout when query is active */}
      {searchResults !== null && (
        <div className="space-y-2">
          {searchResults.length === 0 ? (
            <p className="text-center text-sm text-quiet-muted py-4">No circles match "{query}"</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {searchResults.map((circle) => (
                <CircleCard
                  key={circle.id}
                  circle={circle}
                  isMember={joinedIds.has(circle.id)}
                  joiningId={joiningId}
                  memberCount={memberCounts[circle.id]}
                  latestPost={latestPosts[circle.id]}
                  onSelect={handleSelect}
                  onJoin={handleJoin}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sectioned layout — hidden while searching */}
      {searchResults === null && <>

      {/* Location prompt — shown at the top when no country is set */}
      {!userCountry && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-800">
            <button
              onClick={onSetLocation}
              className="font-medium underline underline-offset-2 hover:text-amber-900 transition-colors"
            >
              Set your location
            </button>{" "}
            to see local circles first.
          </p>
        </div>
      )}

      {/* Your circles */}
      {circles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-quiet-muted">Your circles</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {visibleCircles.map((circle) => (
              <CircleCard
                key={circle.id}
                circle={circle}
                isMember
                joiningId={joiningId}
                memberCount={memberCounts[circle.id]}
                latestPost={latestPosts[circle.id]}
                onSelect={handleSelect}
                onJoin={handleJoin}
              />
            ))}
          </div>
          {circles.length > INITIAL_SHOW && (
            <button
              onClick={() => setShowAllOwn(!showAllOwn)}
              className="mt-1 text-xs text-quiet-muted hover:text-quiet-slate transition-colors"
            >
              {showAllOwn ? "Show less" : `View more (${circles.length - INITIAL_SHOW} more)`}
            </button>
          )}
        </div>
      )}

      {/* No location set — flat list + prompt */}
      {!userCountry && discoverableCircles.length > 0 && (
        <DiscoverSection
          label="Discover circles"
          circles={discoverableCircles}
          joiningId={joiningId}
          memberCounts={memberCounts}
          latestPosts={latestPosts}
          onSelect={handleSelect}
          onJoin={handleJoin}
        />
      )}

      {/* Local circles section */}
      {userCountry && localCircles.length > 0 && (
        <DiscoverSection
          label={
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              In {countryLabel}
            </span>
          }
          circles={localCircles}
          joinedIds={joinedIds}
          joiningId={joiningId}
          memberCounts={memberCounts}
          latestPosts={latestPosts}
          onSelect={handleSelect}
          onJoin={handleJoin}
        />
      )}

      {/* Nudge when no local circles at all */}
      {userCountry && localCircles.length === 0 && (
        <div className="rounded-xl border border-quiet-border bg-white p-4 space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-quiet-slate">
            <MapPin className="h-4 w-4 text-quiet-muted" />
            In {countryLabel}
          </p>
          <p className="text-sm text-quiet-muted">
            No circles in {countryLabel} yet —{" "}
            <button
              className="underline hover:text-quiet-slate transition-colors"
              onClick={() => setShowCreate(true)}
            >
              start one!
            </button>
          </p>
        </div>
      )}

      {/* Other countries — always visible */}
      {userCountry && otherCircles.length > 0 && (
        <DiscoverSection
          label="Everywhere else"
          circles={otherCircles}
          joiningId={joiningId}
          memberCounts={memberCounts}
          latestPosts={latestPosts}
          onSelect={handleSelect}
          onJoin={handleJoin}
        />
      )}

      {/* End sectioned layout */}
      </>}

      {/* End list view */}
      </>}

      {/* Create circle */}
      {!showCreate ? (
        <Button
          variant="outline"
          onClick={() => setShowCreate(true)}
          className="w-full"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {circles.length === 0 && discoverableCircles.length === 0
            ? "Create your first circle"
            : "Create another circle"}
        </Button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-lg border border-quiet-border bg-white p-4"
        >
          <div>
            <label
              htmlFor="circle-name"
              className="mb-1 block text-sm text-quiet-muted"
            >
              Circle name
            </label>
            <input
              id="circle-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Oak Street Neighbors"
              required
              autoFocus
              className="w-full rounded-md border border-quiet-border bg-quiet-offwhite p-2.5 text-sm text-quiet-slate focus:border-quiet-accent focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="circle-desc"
              className="mb-1 block text-sm text-quiet-muted"
            >
              Tagline (optional)
            </label>
            <input
              id="circle-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A quiet space for..."
              className="w-full rounded-md border border-quiet-border bg-quiet-offwhite p-2.5 text-sm text-quiet-slate focus:border-quiet-accent focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={creating}>
              Create
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Shared discoverable circle list ─────────────────

function DiscoverSection({
  label,
  circles,
  joinedIds = new Set(),
  joiningId,
  memberCounts = {},
  latestPosts = {},
  onSelect,
  onJoin,
}: {
  label: React.ReactNode
  circles: Circle[]
  joinedIds?: Set<string>
  joiningId: string | null
  memberCounts?: Record<string, number>
  latestPosts?: Record<string, string>
  onSelect: (circle: Circle) => void
  onJoin: (circle: Circle) => Promise<void>
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-quiet-muted">{label}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {circles.map((circle) => (
          <CircleCard
            key={circle.id}
            circle={circle}
            isMember={joinedIds.has(circle.id)}
            joiningId={joiningId}
            memberCount={memberCounts[circle.id]}
            latestPost={latestPosts[circle.id]}
            onSelect={onSelect}
            onJoin={onJoin}
          />
        ))}
      </div>
    </div>
  )
}

