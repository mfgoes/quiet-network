import { useState } from "react"
import { Button } from "@/components/ui/button"

const AVATAR_OPTIONS = [
  "🏠", "🌳", "🌻", "🐕", "🐈", "☕", "📚", "🎵",
  "🌙", "🌿", "🍂", "🧑‍🌾", "🚲", "🎨", "🌸", "🦉",
  "🏔️", "🌊", "🍞", "🧘",
]

interface ProfileSetupProps {
  onComplete: (profile: {
    display_name: string
    avatar_emoji: string
    bio: string
  }) => Promise<void>
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [displayName, setDisplayName] = useState("")
  const [avatar, setAvatar] = useState("🏠")
  const [bio, setBio] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await onComplete({
        display_name: displayName.trim(),
        avatar_emoji: avatar,
        bio: bio.trim(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
    setSubmitting(false)
  }

  return (
    <div className="mx-auto max-w-sm">
      <p className="mb-6 text-center text-sm text-quiet-muted">
        Set up your profile before joining a neighborhood.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="displayName"
            className="mb-1 block text-sm text-quiet-muted"
          >
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={30}
            placeholder="How should neighbors know you?"
            className="w-full rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate placeholder:text-quiet-muted/50 focus:border-quiet-accent focus:outline-none"
          />
        </div>

        <div>
          <span className="mb-2 block text-sm text-quiet-muted">Avatar</span>
          <div className="grid grid-cols-10 gap-1">
            {AVATAR_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatar(emoji)}
                className={`flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors ${
                  avatar === emoji
                    ? "bg-quiet-accent/15 ring-2 ring-quiet-accent"
                    : "hover:bg-quiet-border/50"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="bio"
            className="mb-1 block text-sm text-quiet-muted"
          >
            Bio <span className="text-quiet-muted/50">(optional)</span>
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            placeholder="A few words about yourself..."
            className="w-full resize-none rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate placeholder:text-quiet-muted/50 focus:border-quiet-accent focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-quiet-muted/50">
            {bio.length}/160
          </p>
        </div>

        {error && <p className="text-sm text-quiet-warm">{error}</p>}

        <Button
          type="submit"
          disabled={submitting || !displayName.trim()}
          className="w-full"
        >
          Save &amp; continue
        </Button>
      </form>
    </div>
  )
}
