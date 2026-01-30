import { useState } from "react"
import { ChevronDown, Info, LogOut, Pencil, Trash2, UserMinus } from "lucide-react"
import { toast } from "sonner"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
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
  onLeaveAllCircles: () => Promise<void>
  onDeleteAccount: () => Promise<void>
}

export function ProfilePage({ profile, onSave, onSignOut, onAbout, onLeaveAllCircles, onDeleteAccount }: ProfilePageProps) {
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

        <DangerZone
          onLeaveAllCircles={onLeaveAllCircles}
          onDeleteAccount={onDeleteAccount}
        />
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

// ─── Danger zone ─────────────────────────────────────

function DangerZone({
  onLeaveAllCircles,
  onDeleteAccount,
}: {
  onLeaveAllCircles: () => Promise<void>
  onDeleteAccount: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState("")
  const [busy, setBusy] = useState(false)

  const handleLeaveAll = async () => {
    if (!window.confirm("Leave all circles? You can rejoin them later.")) return
    setBusy(true)
    try {
      await onLeaveAllCircles()
      toast.success("Left all circles.")
    } catch {
      toast.error("Something went wrong.")
    }
    setBusy(false)
  }

  const handleDelete = async () => {
    if (confirmDelete !== "DELETE") return
    setBusy(true)
    try {
      await onDeleteAccount()
    } catch {
      toast.error("Something went wrong.")
      setBusy(false)
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-8">
      <div className="rounded-lg border border-quiet-border">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm text-quiet-muted hover:text-quiet-slate transition-colors rounded-lg">
          <span>Danger zone</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-quiet-border px-4 py-4 space-y-4">
            {/* Leave all circles */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-quiet-slate">Leave all circles</p>
                <p className="text-xs text-quiet-muted">
                  Remove yourself from every circle. You can rejoin later.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={handleLeaveAll}
                className="shrink-0 text-quiet-muted"
              >
                <UserMinus className="mr-1.5 h-3.5 w-3.5" />
                Leave all
              </Button>
            </div>

            <hr className="border-quiet-border" />

            {/* Delete account */}
            <div>
              <p className="text-sm font-medium text-quiet-slate">Delete account</p>
              <p className="text-xs text-quiet-muted mt-1">
                Permanently delete your account, posts, and all data. This cannot be undone.
              </p>
              <div className="mt-3 space-y-2">
                <label className="block text-xs text-quiet-muted">
                  Type <span className="font-mono font-semibold text-quiet-slate">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.value)}
                  placeholder="DELETE"
                  className="w-full rounded-md border border-quiet-border bg-white p-2 text-sm text-quiet-slate placeholder:text-quiet-muted/40 focus:border-quiet-warm focus:outline-none"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={confirmDelete !== "DELETE" || busy}
                  onClick={handleDelete}
                  className="w-full text-quiet-warm border-quiet-warm/30 hover:bg-quiet-warm/5 disabled:opacity-40"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  {busy ? "Deleting..." : "Permanently delete account"}
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
