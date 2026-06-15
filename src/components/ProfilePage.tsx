'use client'

import { useEffect, useRef, useState } from "react"
import { Bell, Calendar, CheckCircle, ChevronDown, Info, LogOut, MapPin, Pencil, Plus, ShieldCheck, Star, Trash2, UserMinus, Wrench, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { linkifyText } from "@/lib/utils"
import { PostPreviewCard } from "@/components/PostPreviewCard"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { SocialIcon } from "@/components/SocialIcon"
import { CircleIcon } from "@/components/CircleIcon"
import { useFavorites, useCircleMemberCounts, useUserPosts, useFollowCounts, useWatchmakerClaimRequests, useWatchmakerClaimReviewQueue, useOwnedWatchmakerProfiles } from "@/lib/hooks"
import { AVATAR_OPTIONS, avatarUrl, getBannerBg } from "@/types"
import type { Profile, ProfileLink, Circle } from "@/types"

const COUNTRIES = [
  { code: "NL", label: "Netherlands", flag: "🇳🇱" },
  { code: "BE", label: "Belgium",     flag: "🇧🇪" },
  { code: "DE", label: "Germany",     flag: "🇩🇪" },
  { code: "FR", label: "France",      flag: "🇫🇷" },
  { code: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { code: "US", label: "United States",  flag: "🇺🇸" },
  { code: "ID", label: "Indonesia",   flag: "🇮🇩" },
  { code: "OTHER", label: "Other",    flag: "🌍" },
]

const MAX_LINKS = 5
const CIRCLES_PREVIEW = 4

interface ProfilePageProps {
  defaultEditing?: boolean
  profile: Profile
  userId: string
  circles: Circle[]
  onSave: (updates: {
    display_name: string
    avatar_emoji: string
    bio: string
    username: string
    country?: string | null
    links: ProfileLink[] | null
    posts_public: boolean
  }) => Promise<void>
  onSignOut: () => void
  onAbout: () => void
  onNotificationSettings: () => void
  onLeaveAllCircles: () => Promise<void>
  onDeleteAccount: () => Promise<void>
}

export function ProfilePage({ defaultEditing = false, profile, userId, circles, onSave, onSignOut, onAbout, onNotificationSettings, onLeaveAllCircles, onDeleteAccount }: ProfilePageProps) {
  const router = useRouter()
  const { favoritedCircleIds } = useFavorites(userId)
  const favoritedCircles = circles.filter(c => favoritedCircleIds.includes(c.id))
  const memberCounts = useCircleMemberCounts(circles.map(c => c.id))
  const { posts } = useUserPosts(profile.posts_public !== false ? userId : undefined)
  const { followerCount, followingCount } = useFollowCounts(userId)
  const { claims: watchmakerClaims } = useWatchmakerClaimRequests(userId)
  const { claims: reviewClaims, isReviewer, reviewClaim } = useWatchmakerClaimReviewQueue(userId)
  const { watchmakers: ownedWatchmakers } = useOwnedWatchmakerProfiles(userId)
  const [editing, setEditing] = useState(defaultEditing)
  const [showAllCircles, setShowAllCircles] = useState(false)
  const [reviewingClaimId, setReviewingClaimId] = useState<string | null>(null)
  const countryRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (defaultEditing && countryRef.current) {
      countryRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [])

  const [displayName, setDisplayName] = useState(profile.display_name)
  const [username, setUsername] = useState(profile.username)
  const [avatar, setAvatar] = useState(profile.avatar_emoji)
  const [bio, setBio] = useState(profile.bio)
  const [country, setCountry] = useState(profile.country ?? "")
  const [links, setLinks] = useState<ProfileLink[]>(profile.links ?? [])
  const [postsPublic, setPostsPublic] = useState(profile.posts_public !== false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const countryDef = COUNTRIES.find(c => c.code === profile.country)
  const visibleCircles = showAllCircles ? circles : circles.slice(0, CIRCLES_PREVIEW)

  const handleReviewClaim = async (claimId: string, decision: "approved" | "rejected") => {
    setReviewingClaimId(claimId)
    const { error } = await reviewClaim(claimId, decision)
    setReviewingClaimId(null)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(decision === "approved" ? "Claim approved." : "Claim rejected.")
  }

  const handleSave = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const cleanLinks = links.filter(l => l.label.trim() && l.url.trim())
      await onSave({
        display_name: displayName.trim(),
        avatar_emoji: avatar,
        bio: bio.trim(),
        username: username.trim().toLowerCase(),
        country: country || null,
        links: cleanLinks.length > 0 ? cleanLinks : null,
        posts_public: postsPublic,
      })
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
    setSubmitting(false)
  }

  // ── View mode ─────────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="mx-auto max-w-3xl">
        {/* ── Header ── */}
        <div className="flex items-start gap-5 mb-6">
          <img
            src={avatarUrl(profile.avatar_emoji)}
            alt="avatar"
            className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-quiet-border"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-quiet-slate leading-tight">
                  {profile.display_name}
                </h1>
                {profile.username && (
                  <p className="text-sm text-quiet-muted">@{profile.username}</p>
                )}
              </div>
              <Button onClick={() => setEditing(true)} className="shrink-0">
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit profile
              </Button>
            </div>

            {profile.bio && (
              <p className="mt-2 text-sm text-quiet-slate leading-relaxed">{linkifyText(profile.bio)}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-quiet-muted">
              {countryDef && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {countryDef.flag} {countryDef.label}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined {memberSince}
              </span>
            </div>

            {profile.links && profile.links.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-quiet-offwhite px-3 py-1 text-xs font-medium text-quiet-slate transition-colors hover:bg-quiet-border/50"
                  >
                    <SocialIcon url={link.url} />
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="mb-6 flex gap-6 border-b border-quiet-border pb-5">
          <div className="text-center">
            <p className="text-lg font-semibold text-quiet-slate">{circles.length}</p>
            <p className="text-xs text-quiet-muted">Circles</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-quiet-slate">{posts.length}</p>
            <p className="text-xs text-quiet-muted">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-quiet-slate">{followerCount}</p>
            <p className="text-xs text-quiet-muted">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-quiet-slate">{followingCount}</p>
            <p className="text-xs text-quiet-muted">Following</p>
          </div>
          {favoritedCircles.length > 0 && (
            <div className="text-center">
              <p className="text-lg font-semibold text-quiet-slate">{favoritedCircles.length}</p>
              <p className="text-xs text-quiet-muted flex items-center gap-1 justify-center">
                <Star className="h-3 w-3 fill-current text-yellow-400" />
                Starred
              </p>
            </div>
          )}
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex gap-6 items-start">

          {/* ── Main column ── */}
          <div className="flex-1 min-w-0 space-y-8">
            {isReviewer && reviewClaims.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-quiet-slate">
                  <ShieldCheck className="h-4 w-4 text-quiet-muted" />
                  Watchmaker claim review
                </h2>
                <div className="space-y-2">
                  {reviewClaims.map((claim) => (
                    <div key={claim.id} className="rounded-xl border border-quiet-border bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-quiet-slate">{claim.watchmaker_name}</p>
                          <p className="mt-1 text-xs text-quiet-muted">{claim.claimant_role}</p>
                        </div>
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                          pending
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-quiet-slate">{claim.proof}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={reviewingClaimId === claim.id}
                          onClick={() => handleReviewClaim(claim.id, "approved")}
                        >
                          <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={reviewingClaimId === claim.id}
                          onClick={() => handleReviewClaim(claim.id, "rejected")}
                          className="bg-white"
                        >
                          <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {ownedWatchmakers.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-quiet-slate">
                  <ShieldCheck className="h-4 w-4 text-quiet-muted" />
                  Claimed businesses
                </h2>
                <div className="space-y-2">
                  {ownedWatchmakers.map((watchmaker) => (
                    <div key={watchmaker.id} className="rounded-xl border border-quiet-border bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-quiet-slate">{watchmaker.name}</p>
                          <p className="mt-1 text-xs text-quiet-muted">
                            {watchmaker.city}, {watchmaker.country}
                          </p>
                        </div>
                        {watchmaker.rep_friendly && watchmaker.rep_friendly !== "unknown" && (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                            {watchmaker.rep_friendly === "yes" ? "Rep friendly" : "Factory only"}
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/watchmakers?manage=${encodeURIComponent(watchmaker.slug ?? watchmaker.id)}`)}
                        className="mt-3 bg-white"
                      >
                        <Wrench className="mr-1.5 h-3.5 w-3.5" />
                        Manage profile
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {watchmakerClaims.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold text-quiet-slate">Business claims</h2>
                <div className="space-y-2">
                  {watchmakerClaims.map((claim) => (
                    <div key={claim.id} className="rounded-xl border border-quiet-border bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-quiet-slate">{claim.watchmaker_name}</p>
                          <p className="mt-1 text-xs text-quiet-muted">{claim.claimant_role}</p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            claim.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : claim.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {claim.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Circles */}
            {circles.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold text-quiet-slate">Circles</h2>
                <div className="grid grid-cols-2 gap-2">
                  {visibleCircles.map(circle => {
                    const hint = getBannerBg(circle.banner_color, circle.name)
                    const count = memberCounts[circle.id]
                    return (
                      <button
                        key={circle.id}
                        onClick={() => router.push(`/${circle.slug}`)}
                        className="relative flex items-center gap-3 rounded-xl border border-quiet-border bg-white p-3 text-left transition-all hover:shadow-sm overflow-hidden"
                      >
                        <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl" style={{ backgroundColor: hint }} />
                        <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="lg" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-quiet-slate truncate">{circle.name}</p>
                          {count !== undefined && (
                            <p className="text-xs text-quiet-muted">{count.toLocaleString()} members</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {circles.length > CIRCLES_PREVIEW && (
                  <button
                    onClick={() => setShowAllCircles(v => !v)}
                    className="mt-3 w-full rounded-lg border border-quiet-border bg-white py-2 text-xs text-quiet-muted transition-colors hover:bg-quiet-aged"
                  >
                    {showAllCircles ? "Show less" : `View all ${circles.length} circles`}
                  </button>
                )}
              </section>
            )}

            {/* Posts */}
            {profile.posts_public !== false && (
              <section>
                <h2 className="mb-3 text-sm font-semibold text-quiet-slate">Posts</h2>
                {posts.length === 0 ? (
                  <p className="text-sm text-quiet-muted italic">No posts yet</p>
                ) : (
                  <div className="space-y-2">
                    {posts.map(post => (
                      <PostPreviewCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <aside className="w-52 shrink-0 space-y-4">

            {/* Public posts toggle */}
            <div className="rounded-xl border border-quiet-border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-quiet-muted leading-snug">Public posts</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={postsPublic}
                  onClick={async () => {
                    const next = !postsPublic
                    setPostsPublic(next)
                    try {
                      await onSave({
                        display_name: profile.display_name,
                        avatar_emoji: profile.avatar_emoji,
                        bio: profile.bio,
                        username: profile.username,
                        country: profile.country ?? null,
                        links: profile.links,
                        posts_public: next,
                      })
                    } catch {
                      setPostsPublic(!next)
                      toast.error("Couldn't save setting.")
                    }
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    postsPublic ? "bg-quiet-accent" : "bg-quiet-border"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${postsPublic ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="rounded-xl border border-quiet-border bg-white p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-quiet-muted">Settings</h3>
              <div className="space-y-1">
                <button
                  onClick={onNotificationSettings}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-quiet-slate transition-colors hover:bg-quiet-aged"
                >
                  <Bell className="h-3.5 w-3.5 text-quiet-muted" />
                  Notifications
                </button>
                <button
                  onClick={onAbout}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-quiet-slate transition-colors hover:bg-quiet-aged"
                >
                  <Info className="h-3.5 w-3.5 text-quiet-muted" />
                  About
                </button>
                <button
                  onClick={onSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-quiet-warm transition-colors hover:bg-quiet-aged"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </div>

            <DangerZone onLeaveAllCircles={onLeaveAllCircles} onDeleteAccount={onDeleteAccount} />
          </aside>
        </div>
      </div>
    )
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-sm">
      <form
        onSubmit={e => { e.preventDefault(); handleSave() }}
        className="space-y-5"
      >
        <div>
          <span className="mb-2 block text-sm text-quiet-muted">Avatar</span>
          <div className="grid grid-cols-6 gap-2">
            {AVATAR_OPTIONS.map(name => (
              <button
                key={name}
                type="button"
                onClick={() => setAvatar(name)}
                className={`flex items-center justify-center rounded-md p-1 transition-colors ${
                  avatar === name ? "ring-2 ring-quiet-accent bg-quiet-accent/15" : "hover:bg-quiet-border/50"
                }`}
              >
                <img src={avatarUrl(name)} alt={name} className="h-10 w-10 rounded-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="editUsername" className="mb-1 block text-sm text-quiet-muted">Username</label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-quiet-muted">@</span>
            <input
              id="editUsername"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              required
              maxLength={20}
              className="w-full rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate placeholder:text-quiet-muted/50 focus:border-quiet-accent focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="editDisplayName" className="mb-1 block text-sm text-quiet-muted">Display name</label>
          <input
            id="editDisplayName"
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            required
            maxLength={30}
            className="w-full rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate placeholder:text-quiet-muted/50 focus:border-quiet-accent focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="editBio" className="mb-1 block text-sm text-quiet-muted">
            Bio <span className="text-quiet-muted/50">(optional)</span>
          </label>
          <textarea
            id="editBio"
            value={bio}
            onChange={e => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            className="w-full resize-none rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate placeholder:text-quiet-muted/50 focus:border-quiet-accent focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-quiet-muted/50">{bio.length}/160</p>
        </div>

        <div>
          <label htmlFor="editCountry" className="mb-1 block text-sm text-quiet-muted">
            Country <span className="text-quiet-muted/50">(optional)</span>
          </label>
          <select
            id="editCountry"
            ref={countryRef}
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="w-full rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate focus:border-quiet-accent focus:outline-none"
          >
            <option value="">— not set —</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-quiet-muted">
            Links <span className="text-quiet-muted/50">(optional)</span>
          </label>
          <div className="space-y-2">
            {links.map((link, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <div className="flex-1 space-y-1">
                  <input
                    value={link.label}
                    onChange={e => setLinks(prev => prev.map((l, j) => j === i ? { ...l, label: e.target.value } : l))}
                    placeholder="Label"
                    maxLength={40}
                    className="w-full rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate placeholder:text-quiet-muted/50 focus:border-quiet-accent focus:outline-none"
                  />
                  <input
                    value={link.url}
                    onChange={e => setLinks(prev => prev.map((l, j) => j === i ? { ...l, url: e.target.value } : l))}
                    placeholder="https://..."
                    maxLength={300}
                    className="w-full rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate placeholder:text-quiet-muted/50 focus:border-quiet-accent focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setLinks(prev => prev.filter((_, j) => j !== i))}
                  className="mt-2 rounded p-1 text-quiet-muted hover:bg-quiet-border/50 hover:text-quiet-warm transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          {links.length < MAX_LINKS && (
            <button
              type="button"
              onClick={() => setLinks([...links, { label: "", url: "" }])}
              className="mt-2 flex items-center gap-1 text-xs text-quiet-muted hover:text-quiet-slate transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add link
            </button>
          )}
        </div>

        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <div>
            <span className="text-sm text-quiet-muted">Show posts on public profile</span>
            <p className="text-xs text-quiet-muted/60">Visitors to your profile can see your recent posts</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={postsPublic}
            onClick={() => setPostsPublic(v => !v)}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${postsPublic ? "bg-quiet-accent" : "bg-quiet-border"}`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${postsPublic ? "translate-x-4" : "translate-x-0"}`} />
          </button>
        </label>

        {error && <p className="text-sm text-quiet-warm">{error}</p>}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => {
              setDisplayName(profile.display_name)
              setUsername(profile.username)
              setAvatar(profile.avatar_emoji)
              setBio(profile.bio)
              setCountry(profile.country ?? "")
              setLinks(profile.links ?? [])
              setPostsPublic(profile.posts_public !== false)
              setEditing(false)
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !displayName.trim()} className="flex-1">
            Save
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Danger zone ─────────────────────────────────────

function DangerZone({ onLeaveAllCircles, onDeleteAccount }: { onLeaveAllCircles: () => Promise<void>; onDeleteAccount: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState("")
  const [busy, setBusy] = useState(false)

  const handleLeaveAll = async () => {
    if (!window.confirm("Leave all circles? You can rejoin them later.")) return
    setBusy(true)
    try { await onLeaveAllCircles(); toast.success("Left all circles.") }
    catch { toast.error("Something went wrong.") }
    setBusy(false)
  }

  const handleDelete = async () => {
    if (confirmDelete !== "DELETE") return
    setBusy(true)
    try { await onDeleteAccount() }
    catch { toast.error("Something went wrong."); setBusy(false) }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-quiet-border bg-white">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-xs text-quiet-muted hover:text-quiet-slate transition-colors rounded-xl">
          <span>Danger zone</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-quiet-border px-4 py-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-quiet-slate">Leave all circles</p>
                <p className="text-xs text-quiet-muted">You can rejoin later.</p>
              </div>
              <Button variant="outline" size="sm" disabled={busy} onClick={handleLeaveAll} className="shrink-0 text-quiet-muted">
                <UserMinus className="mr-1 h-3 w-3" />
                Leave
              </Button>
            </div>
            <hr className="border-quiet-border" />
            <div>
              <p className="text-xs font-medium text-quiet-slate">Delete account</p>
              <p className="text-xs text-quiet-muted mt-0.5">Permanently deletes all your data.</p>
              <div className="mt-2 space-y-1.5">
                <input
                  type="text"
                  value={confirmDelete}
                  onChange={e => setConfirmDelete(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full rounded-md border border-quiet-border bg-white p-2 text-xs text-quiet-slate placeholder:text-quiet-muted/40 focus:border-quiet-warm focus:outline-none"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={confirmDelete !== "DELETE" || busy}
                  onClick={handleDelete}
                  className="w-full text-quiet-warm border-quiet-warm/30 hover:bg-quiet-warm/5 disabled:opacity-40"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  {busy ? "Deleting..." : "Delete account"}
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
