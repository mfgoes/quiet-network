import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AVATAR_OPTIONS, avatarUrl, slugify } from "@/types"

const COUNTRIES = [
  { code: "NL", label: "Netherlands" },
  { code: "BE", label: "Belgium" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "ID", label: "Indonesia" },
  { code: "OTHER", label: "Other" },
]

interface ProfileSetupProps {
  onComplete: (profile: {
    display_name: string
    avatar_emoji: string
    bio: string
    username: string
    country?: string | null
  }) => Promise<void>
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [editingUsername, setEditingUsername] = useState(false)
  const [avatar, setAvatar] = useState("house")
  const [bio, setBio] = useState("")
  const [country, setCountry] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const usernameRegex = /^[a-z0-9][a-z0-9_-]{1,18}[a-z0-9]$/

  // The effective username: manual override if editing, otherwise derived from display name
  const derivedUsername = slugify(displayName)
  const effectiveUsername = editingUsername ? username : derivedUsername

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value)
    // If user hasn't manually edited, keep username in sync
    if (!editingUsername) {
      setUsername(slugify(value))
    }
  }

  const handleEditUsername = () => {
    setUsername(derivedUsername)
    setEditingUsername(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedUsername = effectiveUsername.trim()
    if (!usernameRegex.test(trimmedUsername)) {
      setError("Username must be 3-20 characters, lowercase letters, numbers, hyphens, or underscores.")
      return
    }

    setSubmitting(true)
    try {
      await onComplete({
        display_name: displayName.trim(),
        avatar_emoji: avatar,
        bio: bio.trim(),
        username: trimmedUsername,
        country: country || null,
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
            onChange={(e) => handleDisplayNameChange(e.target.value)}
            required
            maxLength={30}
            placeholder="How should neighbors know you?"
            className="w-full rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate placeholder:text-quiet-muted/50 focus:border-quiet-accent focus:outline-none"
          />
          {displayName.trim() && !editingUsername && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-quiet-muted/70">
              <span>Your username will be <span className="text-quiet-slate">@{derivedUsername || "..."}</span></span>
              <button
                type="button"
                onClick={handleEditUsername}
                className="text-quiet-accent hover:text-quiet-slate transition-colors"
              >
                Edit
              </button>
            </p>
          )}
        </div>

        {editingUsername && (
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm text-quiet-muted"
            >
              Username
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-quiet-muted">@</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                required
                maxLength={20}
                placeholder="your-username"
                className="w-full rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate placeholder:text-quiet-muted/50 focus:border-quiet-accent focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-quiet-muted/50">
              Your shareable address: /user/{username || "..."}
            </p>
          </div>
        )}

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

        <div>
          <label
            htmlFor="country"
            className="mb-1 block text-sm text-quiet-muted"
          >
            Where are you based? <span className="text-quiet-muted/50">(optional)</span>
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-md border border-quiet-border bg-white p-2.5 text-sm text-quiet-slate focus:border-quiet-accent focus:outline-none"
          >
            <option value="">— select a country —</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-quiet-warm">{error}</p>}

        <Button
          type="submit"
          disabled={submitting || !displayName.trim() || !effectiveUsername.trim()}
          className="w-full"
        >
          Save &amp; continue
        </Button>
      </form>
    </div>
  )
}
