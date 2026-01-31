import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Circle } from "@/types"

interface SettingsTabProps {
  circle: Circle
  onSave: (updates: { description?: string | null; about?: string | null; rules?: string | null }) => Promise<void>
  onDelete: () => Promise<void>
}

export function SettingsTab({ circle, onSave, onDelete }: SettingsTabProps) {
  const [description, setDescription] = useState(circle.description ?? "")
  const [about, setAbout] = useState(circle.about ?? "")
  const [rules, setRules] = useState(circle.rules ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    await onSave({
      description: description || null,
      about: about || null,
      rules: rules || null,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete()
    setDeleting(false)
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-quiet-slate mb-1.5">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short description of this circle"
          className="w-full rounded-md border border-quiet-border bg-white px-3 py-2 text-sm text-quiet-slate placeholder:text-quiet-muted focus:outline-none focus:ring-1 focus:ring-quiet-slate"
        />
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
        <label className="block text-sm font-medium text-quiet-slate mb-1.5">
          Rules
        </label>
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
