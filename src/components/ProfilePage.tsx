import { useState } from "react"
import { Info, LogOut, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AVATAR_OPTIONS, avatarUrl } from "@/types"
import type { Profile } from "@/types"

interface ProfilePageProps {
  profile: Profile
  onSave: (updates: {
    display_name: string
    avatar_emoji: string
    bio: string
    username: string
  }) => Promise<void>
  onSignOut: () => void
  onAbout: () => void
}

export function ProfilePage({ profile, onSave, onSignOut, onAbout }: ProfilePageProps) {
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [username, setUsername] = useState(profile.username)
  const [avatar, setAvatar] = useState(profile.avatar_emoji)
  const [bio, setBio] = useState(profile.bio)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  const handleSave = async () => {
    setError(null)
    setSubmitting(true)
    try {
      await onSave({
        display_name: displayName.trim(),
        avatar_emoji: avatar,
        bio: bio.trim(),
        username: username.trim().toLowerCase(),
      })
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
    setSubmitting(false)
  }

  if (!editing) {
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

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setEditing(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit profile
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={onAbout}
          >
            <Info className="mr-2 h-4 w-4" />
            About Quiet Network
          </Button>
          <Button
            variant="ghost"
            className="w-full text-quiet-warm"
            onClick={onSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
        className="space-y-5"
      >
        <div>
          <span className="mb-2 block text-sm text-quiet-muted">Avatar</span>
          <div className="grid grid-cols-6 gap-2">
            {AVATAR_OPTIONS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setAvatar(name)}
                className={`flex items-center justify-center rounded-md p-1 transition-colors ${
                  avatar === name
                    ? "ring-2 ring-quiet-accent bg-quiet-accent/15"
                    : "hover:bg-quiet-border/50"
                }`}
              >
                <img
                  src={avatarUrl(name)}
                  alt={name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="editUsername"
            className="mb-1 block text-sm text-quiet-muted"
          >
            Username
          </label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-quiet-muted">@</span>
            <input
              id="editUsername"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              required
              maxLength={20}
              className="w-full rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate placeholder:text-quiet-muted/50 focus:border-quiet-accent focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="editDisplayName"
            className="mb-1 block text-sm text-quiet-muted"
          >
            Display name
          </label>
          <input
            id="editDisplayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={30}
            className="w-full rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate placeholder:text-quiet-muted/50 focus:border-quiet-accent focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="editBio"
            className="mb-1 block text-sm text-quiet-muted"
          >
            Bio <span className="text-quiet-muted/50">(optional)</span>
          </label>
          <textarea
            id="editBio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            className="w-full resize-none rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate placeholder:text-quiet-muted/50 focus:border-quiet-accent focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-quiet-muted/50">
            {bio.length}/160
          </p>
        </div>

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
              setEditing(false)
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !displayName.trim()}
            className="flex-1"
          >
            Save
          </Button>
        </div>
      </form>
    </div>
  )
}
