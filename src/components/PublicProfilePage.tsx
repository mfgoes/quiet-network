'use client'

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Info, MapPin, MessageSquare, UserPlus, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { avatarUrl, getBannerBg } from "@/types"
import type { Profile, Post, Circle } from "@/types"
import { linkifyText } from "@/lib/utils"
import { SocialIcon } from "@/components/SocialIcon"
import { CircleIcon } from "@/components/CircleIcon"
import { PostPreviewCard } from "@/components/PostPreviewCard"
import { useCircleMemberCounts, useFollow, useFollowCounts } from "@/lib/hooks"
import { useDM } from "@/components/DMContext"

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

const CIRCLES_PREVIEW = 4

interface PublicProfilePageProps {
  profile: Profile
  currentUserId?: string
  circles?: Circle[]
  posts?: Post[]
  postsLoading?: boolean
}

export function PublicProfilePage({ profile, currentUserId, circles = [], posts = [], postsLoading = false }: PublicProfilePageProps) {
  const router = useRouter()
  const memberCounts = useCircleMemberCounts(circles.map(c => c.id))
  const [showAllCircles, setShowAllCircles] = useState(false)
  const visibleCircles = showAllCircles ? circles : circles.slice(0, CIRCLES_PREVIEW)
  const canInteract = !!currentUserId && currentUserId !== profile.id
  const { isFollowing, loading: followLoading, follow, unfollow } = useFollow(
    canInteract ? currentUserId : undefined,
    canInteract ? profile.id : undefined
  )
  const { followerCount, followingCount } = useFollowCounts(profile.id)
  const { startDM } = useDM()
  const [messagingBusy, setMessagingBusy] = useState(false)

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  const countryDef = useMemo(() => COUNTRIES.find(c => c.code === profile.country), [profile.country])
  const showPosts = profile.posts_public !== false

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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-quiet-slate leading-tight">
                  {profile.display_name}
                </h1>
                {profile.is_bot && <Badge variant="bot">Bot</Badge>}
              </div>
              {profile.username && (
                <p className="text-sm text-quiet-muted">@{profile.username}</p>
              )}
            </div>
            {canInteract && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  disabled={followLoading}
                  onClick={isFollowing ? unfollow : follow}
                >
                  {isFollowing
                    ? <><UserMinus className="mr-1.5 h-3.5 w-3.5" />Following</>
                    : <><UserPlus className="mr-1.5 h-3.5 w-3.5" />Follow</>
                  }
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={messagingBusy}
                  onClick={async () => {
                    setMessagingBusy(true)
                    await startDM(profile.id)
                    setMessagingBusy(false)
                  }}
                >
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                  {messagingBusy ? "Opening…" : "Message"}
                </Button>
              </div>
            )}
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
        {showPosts && (
          <div className="text-center">
            <p className="text-lg font-semibold text-quiet-slate">{posts.length}</p>
            <p className="text-xs text-quiet-muted">Posts</p>
          </div>
        )}
        <div className="text-center">
          <p className="text-lg font-semibold text-quiet-slate">{followerCount}</p>
          <p className="text-xs text-quiet-muted">Followers</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-quiet-slate">{followingCount}</p>
          <p className="text-xs text-quiet-muted">Following</p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="space-y-8">

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
        {showPosts && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-quiet-slate">Posts</h2>
            {postsLoading ? (
              <p className="text-sm text-quiet-muted">Loading...</p>
            ) : posts.length === 0 ? (
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

      {/* ── Footer ── */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
        <button
          onClick={() => router.push("/about")}
          className="flex items-center gap-1.5 text-xs text-quiet-muted/60 transition-colors hover:text-quiet-muted"
        >
          <Info className="h-3 w-3" />
          About Quiet Network
        </button>
      </div>
    </div>
  )
}
