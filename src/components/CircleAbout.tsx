import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronDown, LogOut, Pencil, Shield, ExternalLink, Plus, Sparkles, Trash2, Camera } from "lucide-react"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { useCircleMembers } from "@/lib/hooks"
import { avatarUrl, getBannerBg } from "@/types"
import { CircleIcon } from "@/components/CircleIcon"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import type { Circle, CircleLink } from "@/types"

interface CircleAboutProps {
  circle: Circle
  userId: string
  isAdminOrMod?: boolean
  onUpdate: (updates: { about?: string | null; rules?: string | null; links?: CircleLink[] | null }) => Promise<void>
  onUploadAvatar?: (file: File) => Promise<{ url: string | null; error: unknown }>
  onLeave?: () => Promise<void>
  onJoin?: () => Promise<void>
  joining?: boolean
  sidebar?: boolean
}

const MAX_AVATAR_SIZE = 100 * 1024 // 100 KB

function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = 100
        canvas.height = 100
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, 100, 100)
        canvas.toBlob(
          (blob) => {
            resolve(new File([blob!], file.name, { type: "image/jpeg" }))
          },
          "image/jpeg",
          0.85
        )
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

function AboutContent({
  circle,
  userId,
  onUpdate,
}: Omit<CircleAboutProps, "sidebar" | "onLeave" | "isAdminOrMod">) {
  const [editing, setEditing] = useState(false)
  const [about, setAbout] = useState(circle.about ?? "")
  const [rules, setRules] = useState(circle.rules ?? "")
  const [links, setLinks] = useState<CircleLink[]>(circle.links ?? [])
  const [saving, setSaving] = useState(false)

  const isCreator = circle.created_by === userId
  const hasContent = circle.about || circle.rules

  const handleSave = async () => {
    setSaving(true)
    const cleanLinks = links.filter((l) => l.label.trim() && l.url.trim())
    await onUpdate({
      about: about.trim() || null,
      rules: rules.trim() || null,
      links: cleanLinks.length > 0 ? cleanLinks : null,
    })
    setEditing(false)
    setSaving(false)
  }

  const handleCancel = () => {
    setAbout(circle.about ?? "")
    setRules(circle.rules ?? "")
    setLinks(circle.links ?? [])
    setEditing(false)
  }

  const addLink = () => {
    if (links.length >= 6) return
    setLinks([...links, { label: "", url: "" }])
  }

  const updateLink = (index: number, field: "label" | "url", value: string) => {
    setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)))
  }

  const removeLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  if (editing) {
    return (
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-quiet-muted">
            About
          </label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="What is this circle about?"
            rows={3}
            maxLength={500}
            className="w-full rounded-md border border-quiet-border bg-quiet-offwhite px-3 py-2 text-sm text-quiet-slate placeholder:text-quiet-muted focus:outline-none focus:ring-1 focus:ring-quiet-accent resize-none"
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="block text-xs font-medium text-quiet-muted">
              Rules
            </label>
            {!rules.trim() && (
              <button
                type="button"
                onClick={() =>
                  setRules(
                    "• Be civil and respectful\n• No doxxing, personal information, or witch-hunts\n• No trolling, baiting, or bad faith posting\n• Source news and claims properly\n• No NSFW / illegal content\n• Political discussion is allowed, but avoid flooding with low-effort partisan content"
                  )
                }
                title="Auto generate rules"
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-quiet-muted hover:text-quiet-slate hover:bg-quiet-border/50 transition-colors"
              >
                <Sparkles className="h-3 w-3" />
                Generate
              </button>
            )}
          </div>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Community guidelines..."
            rows={3}
            maxLength={500}
            className="w-full rounded-md border border-quiet-border bg-quiet-offwhite px-3 py-2 text-sm text-quiet-slate placeholder:text-quiet-muted focus:outline-none focus:ring-1 focus:ring-quiet-accent resize-none"
          />
        </div>

        {/* Links editor */}
        <div>
          <label className="mb-1 block text-xs font-medium text-quiet-muted">
            Links
          </label>
          <div className="space-y-2">
            {links.map((link, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <div className="flex-1 space-y-1">
                  <input
                    value={link.label}
                    onChange={(e) => updateLink(i, "label", e.target.value)}
                    placeholder="Label"
                    maxLength={40}
                    className="w-full rounded-md border border-quiet-border bg-quiet-offwhite px-2.5 py-1.5 text-sm text-quiet-slate placeholder:text-quiet-muted focus:outline-none focus:ring-1 focus:ring-quiet-accent"
                  />
                  <input
                    value={link.url}
                    onChange={(e) => updateLink(i, "url", e.target.value)}
                    placeholder="https://..."
                    maxLength={300}
                    className="w-full rounded-md border border-quiet-border bg-quiet-offwhite px-2.5 py-1.5 text-sm text-quiet-slate placeholder:text-quiet-muted focus:outline-none focus:ring-1 focus:ring-quiet-accent"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  className="mt-1.5 rounded p-1 text-quiet-muted hover:bg-quiet-border/50 hover:text-quiet-warm transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          {links.length < 6 && (
            <button
              type="button"
              onClick={addLink}
              className="mt-2 flex items-center gap-1 text-xs text-quiet-muted hover:text-quiet-slate transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add link
            </button>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {hasContent ? (
        <div className="space-y-3">
          {circle.about && (
            <div>
              <p className="mb-0.5 text-xs font-medium text-quiet-muted">
                About
              </p>
              <p className="text-sm text-quiet-slate whitespace-pre-wrap">
                {circle.about}
              </p>
            </div>
          )}
          {circle.rules && (
            <div>
              <p className="mb-0.5 text-xs font-medium text-quiet-muted">
                Rules
              </p>
              <p className="text-sm text-quiet-slate whitespace-pre-wrap">
                {circle.rules}
              </p>
            </div>
          )}
        </div>
      ) : (
        isCreator ? (
          <button
            onClick={() => setEditing(true)}
            className="w-full rounded-md border border-dashed border-quiet-accent/40 bg-quiet-offwhite px-4 py-4 text-center transition-colors hover:border-quiet-accent hover:bg-quiet-border/30"
          >
            <Pencil className="mx-auto mb-1.5 h-4 w-4 text-quiet-accent" />
            <p className="text-sm font-medium text-quiet-slate">Set up your circle</p>
            <p className="mt-0.5 text-xs text-quiet-muted">Add a description, rules, and links</p>
          </button>
        ) : (
          <p className="text-sm text-quiet-muted">
            No info added yet.
          </p>
        )
      )}

      {/* Links display */}
      {circle.links && circle.links.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs font-medium text-quiet-muted">Links</p>
          {circle.links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md bg-quiet-offwhite px-3 py-2 text-sm font-medium text-quiet-slate transition-colors hover:bg-quiet-border/50"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-quiet-muted" />
              <span className="truncate">{link.label}</span>
            </a>
          ))}
        </div>
      )}

      {isCreator && hasContent && (
        <div className="flex justify-end mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            className="gap-1 text-quiet-muted"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
        </div>
      )}
    </>
  )
}

function MembersSection({ circleId }: { circleId: string }) {
  const { members, count, loading } = useCircleMembers(circleId)

  if (loading) return null

  const displayMembers = members.slice(0, 8)
  const remaining = count - displayMembers.length

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-quiet-muted">Members</p>
        <span className="text-xs font-medium text-quiet-slate">{count}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {displayMembers.map((m) => (
          <Tooltip key={m.username}>
            <TooltipTrigger asChild>
              <img
                src={avatarUrl(m.avatar_emoji)}
                alt={m.display_name}
                className="h-7 w-7 rounded-full object-cover ring-1 ring-quiet-border"
              />
            </TooltipTrigger>
            <TooltipContent>{m.display_name}</TooltipContent>
          </Tooltip>
        ))}
        {remaining > 0 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-quiet-border text-[10px] font-medium text-quiet-muted">
            +{remaining}
          </div>
        )}
      </div>
    </div>
  )
}

function LeaveButton({ onLeave }: { onLeave: () => Promise<void> }) {
  const [leaving, setLeaving] = useState(false)

  return (
    <button
      disabled={leaving}
      onClick={async () => {
        setLeaving(true)
        await onLeave()
        setLeaving(false)
      }}
      className="flex items-center gap-1.5 text-sm text-quiet-muted hover:text-quiet-slate transition-colors disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" />
      {leaving ? "Leaving..." : "Leave circle"}
    </button>
  )
}

function ManageCircleLink({ circleSlug }: { circleSlug: string }) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/admin/${circleSlug}`)}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium text-quiet-slate transition-colors hover:bg-quiet-aged"
    >
      <Shield className="h-4 w-4 text-quiet-muted" />
      Manage circle
    </button>
  )
}

function CircleBanner({ circle, isAdminOrMod, onUploadAvatar }: { circle: Circle; isAdminOrMod?: boolean; onUploadAvatar?: (file: File) => Promise<{ url: string | null; error: unknown }> }) {
  const bannerBg = getBannerBg(circle.banner_color, circle.name)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const canEdit = isAdminOrMod && onUploadAvatar

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onUploadAvatar) return
    e.target.value = ""

    if (!file.type.startsWith("image/")) return

    setUploading(true)
    try {
      const toUpload = file.size > MAX_AVATAR_SIZE ? await compressImage(file) : file
      await onUploadAvatar(toUpload)
    } catch {
      // silently fail
    }
    setUploading(false)
  }

  return (
    <div className="relative">
      <div className="h-20 rounded-t-lg" style={{ backgroundColor: bannerBg }} />
      <div className="absolute -bottom-5 left-4">
        <button
          type="button"
          disabled={!canEdit || uploading}
          onClick={() => canEdit && fileInputRef.current?.click()}
          className={`group relative rounded-full ${canEdit ? "cursor-pointer" : "cursor-default"}`}
        >
          <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="lg" className="ring-2 ring-white" />
          {canEdit && !uploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 transition-colors">
              <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </span>
          )}
        </button>
        {canEdit && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        )}
      </div>
    </div>
  )
}

export function CircleAbout({ circle, userId, isAdminOrMod, onUpdate, onUploadAvatar, onLeave, onJoin, joining, sidebar }: CircleAboutProps) {
  const [open, setOpen] = useState(false)

  // Desktop sidebar: separate cards
  if (sidebar) {
    return (
      <div className="sticky top-8 space-y-3">
        {/* Join CTA for non-members */}
        {onJoin && (
          <div className="rounded-lg border border-quiet-border bg-white px-4 py-4 text-center">
            <p className="text-sm text-quiet-muted mb-3">Join this circle to post and interact.</p>
            <Button className="w-full" disabled={joining} onClick={onJoin}>
              {joining ? "Joining..." : "Join Circle"}
            </Button>
          </div>
        )}

        {/* About / Rules card with banner */}
        <div className="rounded-lg border border-quiet-border bg-white overflow-hidden">
          <CircleBanner circle={circle} isAdminOrMod={isAdminOrMod} onUploadAvatar={onUploadAvatar} />
          <div className="px-4 pt-8 pb-3 border-b border-quiet-border">
            <h3 className="text-sm font-medium text-quiet-slate">About / Rules</h3>
          </div>
          <div className="px-4 py-3">
            <AboutContent circle={circle} userId={userId} onUpdate={onUpdate} />
          </div>
        </div>

        {/* Members card */}
        <div className="rounded-lg border border-quiet-border bg-white">
          <MembersSection circleId={circle.id} />
        </div>

        {/* Manage circle (admin/mod only) */}
        {isAdminOrMod && (
          <div className="rounded-lg border border-quiet-border bg-white px-2 py-1.5">
            <ManageCircleLink circleSlug={circle.slug} />
          </div>
        )}

        {/* Leave circle */}
        {onLeave && (
          <div className="rounded-lg border border-quiet-border bg-white px-4 py-3">
            <LeaveButton onLeave={onLeave} />
          </div>
        )}
      </div>
    )
  }

  // Mobile: collapsible
  return (
    <>
    {onJoin && (
      <div className="mb-4 rounded-lg border border-quiet-border bg-white px-4 py-4 text-center">
        <p className="text-sm text-quiet-muted mb-3">Join this circle to post and interact.</p>
        <Button className="w-full" disabled={joining} onClick={onJoin}>
          {joining ? "Joining..." : "Join Circle"}
        </Button>
      </div>
    )}
    <Collapsible open={open} onOpenChange={setOpen} className="mb-4">
      <div className="rounded-lg border border-quiet-border bg-white overflow-hidden">
        <CircleBanner circle={circle} isAdminOrMod={isAdminOrMod} onUploadAvatar={onUploadAvatar} />
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 pt-8 pb-3 text-sm font-medium text-quiet-slate hover:bg-quiet-aged transition-colors">
          <span>About / Rules</span>
          <ChevronDown
            className={`h-4 w-4 text-quiet-muted transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-quiet-border px-4 py-3">
            <AboutContent circle={circle} userId={userId} onUpdate={onUpdate} />
          </div>
          <div className="border-t border-quiet-border">
            <MembersSection circleId={circle.id} />
          </div>
          {isAdminOrMod && (
            <div className="px-2 py-1.5 border-t border-quiet-border">
              <ManageCircleLink circleSlug={circle.slug} />
            </div>
          )}
          {onLeave && (
            <div className="px-4 py-3 border-t border-quiet-border">
              <LeaveButton onLeave={onLeave} />
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
    </>
  )
}
