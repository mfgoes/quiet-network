import { avatarUrl } from "@/types"
import type { Profile } from "@/types"

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
          <p className="text-center text-sm text-quiet-muted">{profile.bio}</p>
        )}
      </div>

      <p className="text-center text-xs text-quiet-muted">
        Member since {memberSince}
      </p>
    </div>
  )
}
