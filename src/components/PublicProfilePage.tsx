import { avatarUrl } from "@/types"
import type { Profile } from "@/types"
import { linkifyText } from "@/lib/utils"
import { SocialIcon } from "@/components/SocialIcon"

interface PublicProfilePageProps {
  profile: Profile
}

export function PublicProfilePage({ profile }: PublicProfilePageProps) {
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-3">
        <img
          src={avatarUrl(profile.avatar_emoji)}
          alt="avatar"
          className="h-20 w-20 rounded-full object-cover"
        />
        <h2 className="text-xl font-semibold text-quiet-slate">
          {profile.display_name}
        </h2>
        {profile.username && (
          <p className="text-sm text-quiet-muted">@{profile.username}</p>
        )}
        {profile.bio && (
          <p className="text-center text-sm text-quiet-muted">{linkifyText(profile.bio)}</p>
        )}
        {profile.links && profile.links.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {profile.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-quiet-offwhite px-3 py-1.5 text-sm font-medium text-quiet-slate transition-colors hover:bg-quiet-border/50"
              >
                <SocialIcon url={link.url} />
                <span className="truncate">{link.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-quiet-muted">
        Member since {memberSince}
      </p>
    </div>
  )
}
