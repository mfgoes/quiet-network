import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { avatarUrl } from "@/types"
import type { Profile, Post } from "@/types"
import { linkifyText } from "@/lib/utils"
import { SocialIcon } from "@/components/SocialIcon"
import { CircleIcon } from "@/components/CircleIcon"

interface PublicProfilePageProps {
  profile: Profile
  posts?: Post[]
  postsLoading?: boolean
}

function formatAge(createdAt: string): string {
  const elapsed = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.floor(elapsed / (1000 * 60))
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function PublicProfilePage({ profile, posts = [], postsLoading = false }: PublicProfilePageProps) {
  const navigate = useNavigate()
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  const hasBio = !!profile.bio
  const hasLinks = profile.links && profile.links.length > 0
  const showPosts = profile.posts_public !== false

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-3">
        <img
          src={avatarUrl(profile.avatar_emoji)}
          alt="avatar"
          className="h-20 w-20 rounded-full object-cover"
        />
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-quiet-slate">
            {profile.display_name}
          </h2>
          {profile.is_bot && <Badge variant="bot">Bot</Badge>}
        </div>
        {profile.username && (
          <p className="text-sm text-quiet-muted">@{profile.username}</p>
        )}
        {hasBio ? (
          <p className="text-center text-sm text-quiet-muted">{linkifyText(profile.bio)}</p>
        ) : (
          <p className="text-center text-sm text-quiet-muted/60 italic">No bio yet</p>
        )}
        {hasLinks ? (
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {profile.links!.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-quiet-offwhite px-3 py-1.5 text-sm font-medium text-quiet-slate transition-colors hover:bg-quiet-border/50 leading-none"
              >
                <SocialIcon url={link.url} />
                <span className="truncate">{link.label}</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-quiet-muted/60 italic">No public links</p>
        )}
      </div>

      <p className="text-center text-xs text-quiet-muted">
        Member since {memberSince}
      </p>

      {showPosts && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-quiet-slate">Recent posts</h3>
          {postsLoading ? (
            <p className="text-sm text-quiet-muted">Loading...</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-quiet-muted/60 italic">No posts yet</p>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={post.circles ? `/${post.circles.slug}/p/${post.id}` : `/p/${post.id}`}
                  className="block rounded-lg border border-quiet-border bg-white p-3 hover:border-quiet-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    {post.circles && (
                      <div className="flex items-center gap-1.5">
                        <CircleIcon name={post.circles.name} avatarUrl={post.circles.avatar_url} size="xs" />
                        <span className="text-xs text-quiet-muted">{post.circles.name}</span>
                      </div>
                    )}
                    <span className="text-xs text-quiet-muted ml-auto">{formatAge(post.created_at)}</span>
                  </div>
                  <p className="text-sm text-quiet-slate line-clamp-3 leading-snug">
                    {post.content.replace(/<[^>]+>/g, " ").trim()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go back
      </Button>

      <button
        onClick={() => navigate("/about")}
        className="flex w-full items-center justify-center gap-1.5 text-xs text-quiet-muted/60 transition-colors hover:text-quiet-muted"
      >
        <Info className="h-3 w-3" />
        About Quiet Network
      </button>
    </div>
  )
}
