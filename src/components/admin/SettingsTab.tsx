import { useState, useEffect, useRef } from "react"
import { Sparkles, Trash2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CircleIcon } from "@/components/CircleIcon"
import { BANNER_COLORS, getBannerBg, slugify } from "@/types"
import type { Circle } from "@/types"

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

interface SettingsTabProps {
  circle: Circle
  onSave: (updates: { name?: string; slug?: string; description?: string | null; about?: string | null; rules?: string | null; country?: string | null; banner_color?: string | null; avatar_url?: string | null; default_permanent_posts?: boolean }) => Promise<{ error?: unknown }>
  onUploadAvatar: (file: File) => Promise<{ url: string | null; error: unknown }>
  onDelete: () => Promise<void>
}

const MAX_UPLOAD_SIZE = 100 * 1024 // 100 KB

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

export function SettingsTab({ circle, onSave, onUploadAvatar, onDelete }: SettingsTabProps) {
  const [name, setName] = useState(circle.name)
  const [nameSlug, setNameSlug] = useState(circle.slug)
  const [description, setDescription] = useState(circle.description ?? "")
  const [about, setAbout] = useState(circle.about ?? "")
  const [rules, setRules] = useState(circle.rules ?? "")
  const [country, setCountry] = useState(circle.country ?? "")
  const [bannerColor, setBannerColor] = useState(circle.banner_color ?? "")
  const [defaultPermanentPosts, setDefaultPermanentPosts] = useState(circle.default_permanent_posts ?? false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleNameChange = (value: string) => {
    setName(value)
    setNameSlug(slugify(value))
  }

  // Sync local state when circle data changes (e.g. after refetch)
  useEffect(() => {
    setName(circle.name)
    setNameSlug(circle.slug)
    setDescription(circle.description ?? "")
    setAbout(circle.about ?? "")
    setRules(circle.rules ?? "")
    setCountry(circle.country ?? "")
    setBannerColor(circle.banner_color ?? "")
    setDefaultPermanentPosts(circle.default_permanent_posts ?? false)
  }, [circle.name, circle.slug, circle.description, circle.about, circle.rules, circle.country, circle.banner_color, circle.default_permanent_posts])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Avatar upload state
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setSaveError(null)
    const trimmedName = name.trim()
    const result = await onSave({
      ...(trimmedName && trimmedName !== circle.name ? { name: trimmedName, slug: nameSlug } : {}),
      description: description || null,
      about: about || null,
      rules: rules || null,
      country: country || null,
      banner_color: bannerColor || null,
      default_permanent_posts: defaultPermanentPosts,
    })
    setSaving(false)
    if (result?.error) {
      setSaveError("Failed to save. Please try again.")
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    e.target.value = ""

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.")
      return
    }

    setUploadError(null)
    setUploading(true)

    try {
      const toUpload = file.size > MAX_UPLOAD_SIZE ? await compressImage(file) : file
      const { error } = await onUploadAvatar(toUpload)
      if (error) {
        setUploadError("Upload failed. Please try again.")
      }
    } catch {
      setUploadError("Failed to process image.")
    }

    setUploading(false)
  }

  const handleRemoveAvatar = async () => {
    setSaving(true)
    await onSave({ avatar_url: null })
    setSaving(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete()
    setDeleting(false)
  }

  return (
    <div className="space-y-5 max-w-lg">
      {/* Circle name */}
      <div>
        <label className="block text-sm font-medium text-quiet-slate mb-1.5">
          Circle name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Circle name"
          className="w-full rounded-md border border-quiet-border bg-white px-3 py-2 text-sm text-quiet-slate placeholder:text-quiet-muted focus:outline-none focus:ring-1 focus:ring-quiet-slate"
        />
        <p className="mt-1 text-xs text-quiet-muted">
          URL: <span className="font-mono">{nameSlug || "—"}</span>
        </p>
      </div>

      {/* Avatar & Banner preview */}
      <div>
        <label className="block text-sm font-medium text-quiet-slate mb-1.5">
          Circle Avatar
        </label>
        <div className="flex items-center gap-4">
          <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="lg" className="ring-2 ring-quiet-border" />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                {uploading ? "Uploading..." : "Upload image"}
              </Button>
              {circle.avatar_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={handleRemoveAvatar}
                  className="gap-1 text-quiet-muted"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-quiet-muted">JPG, PNG, or WebP. Images over 100 KB are auto-compressed.</p>
            {uploadError && (
              <p className="text-xs text-red-600">{uploadError}</p>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Banner color */}
      <div>
        <label className="block text-sm font-medium text-quiet-slate mb-1.5">
          Banner Color
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {BANNER_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => setBannerColor(bannerColor === c.id ? "" : c.id)}
              className={`h-8 w-8 rounded-full transition-all ${
                bannerColor === c.id
                  ? "ring-2 ring-quiet-slate ring-offset-2"
                  : "ring-1 ring-quiet-border hover:ring-quiet-accent"
              }`}
              style={{ backgroundColor: c.bg }}
              title={c.id}
            />
          ))}
          {bannerColor && (
            <button
              onClick={() => setBannerColor("")}
              className="ml-1 text-xs text-quiet-muted hover:text-quiet-slate transition-colors"
            >
              Reset
            </button>
          )}
        </div>
        {/* Preview */}
        <div
          className="mt-2 h-12 rounded-md transition-colors"
          style={{ backgroundColor: getBannerBg(bannerColor || null, circle.name) }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-quiet-slate mb-1.5">
          Tagline
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short tagline for this circle"
          className="w-full rounded-md border border-quiet-border bg-white px-3 py-2 text-sm text-quiet-slate placeholder:text-quiet-muted focus:outline-none focus:ring-1 focus:ring-quiet-slate"
        />
      </div>

      <div>
        <label htmlFor="circleCountry" className="block text-sm font-medium text-quiet-slate mb-1.5">
          Country
        </label>
        <select
          id="circleCountry"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full rounded-md border border-quiet-border bg-white px-3 py-2 text-sm text-quiet-slate focus:outline-none focus:ring-1 focus:ring-quiet-slate"
        >
          <option value="">— not set —</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-quiet-muted">Used to show this circle to users in that country first.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-quiet-slate mb-1.5">
          Default post duration
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={defaultPermanentPosts}
              onChange={(e) => setDefaultPermanentPosts(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-9 h-5 rounded-full transition-colors ${
                defaultPermanentPosts ? "bg-quiet-slate" : "bg-quiet-border"
              }`}
            />
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                defaultPermanentPosts ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
          <span className="text-sm text-quiet-slate">
            Permanent posts by default
          </span>
        </label>
        <p className="mt-1.5 text-xs text-quiet-muted">
          When enabled, the duration slider in the post composer will default to Permanent. Members can still change it per post.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-quiet-slate mb-1.5">
          About
        </label>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="What is this circle about?"
          rows={4}
          className="w-full rounded-md border border-quiet-border bg-white px-3 py-2 text-sm text-quiet-slate placeholder:text-quiet-muted focus:outline-none focus:ring-1 focus:ring-quiet-slate resize-none"
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <label className="block text-sm font-medium text-quiet-slate">
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
          placeholder="Community guidelines for this circle"
          rows={4}
          className="w-full rounded-md border border-quiet-border bg-white px-3 py-2 text-sm text-quiet-slate placeholder:text-quiet-muted focus:outline-none focus:ring-1 focus:ring-quiet-slate resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600">Saved</span>
        )}
        {saveError && (
          <span className="text-sm text-red-600">{saveError}</span>
        )}
      </div>

      {/* Danger zone */}
      <div className="mt-8 border-t border-quiet-border pt-6">
        <h3 className="text-sm font-medium text-red-600 mb-2">Danger zone</h3>
        {!confirmDelete ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete circle
          </Button>
        ) : (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700 mb-3">
              This will permanently delete <span className="font-medium">{circle.name}</span> and
              all its posts, members, and reports. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={deleting}
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? "Deleting..." : "Yes, delete circle"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
