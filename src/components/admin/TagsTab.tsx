'use client'

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CircleTag } from "@/types"

const TAG_COLORS = [
  { label: "Blue",   value: "var(--color-tag-blue)" },
  { label: "Green",  value: "var(--color-tag-green)" },
  { label: "Amber",  value: "var(--color-tag-amber)" },
  { label: "Pink",   value: "var(--color-tag-pink)" },
  { label: "Purple", value: "var(--color-tag-purple)" },
  { label: "Cyan",   value: "var(--color-tag-cyan)" },
]

interface TagsTabProps {
  tags: CircleTag[]
  onCreate: (name: string, color: string) => Promise<{ error: unknown }>
  onDelete: (tagId: string) => Promise<{ error: unknown }>
}

export function TagsTab({ tags, onCreate, onDelete }: TagsTabProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(TAG_COLORS[0].value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    const trimmed = name.trim().replace(/^#+\s*/, "")
    if (!trimmed) return
    setSaving(true)
    setError(null)
    const { error: err } = await onCreate(trimmed, color)
    if (err) {
      setError("Could not create tag — it may already exist.")
    } else {
      setName("")
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 py-2">
      <p className="text-sm text-quiet-muted">
        Tags help members categorize posts. Only tags you define here will be available when posting in this circle.
      </p>

      {/* Existing tags */}
      {tags.length > 0 ? (
        <div className="space-y-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between rounded-lg border border-quiet-border bg-white px-3 py-2"
            >
              <span
                className="rounded-full px-2.5 py-0.5 text-xs text-quiet-slate"
                style={{ backgroundColor: tag.color }}
              >
                #{tag.name}
              </span>
              <button
                onClick={() => onDelete(tag.id)}
                className="rounded p-1 text-quiet-muted hover:bg-red-50 hover:text-red-500 transition-colors"
                aria-label="Delete tag"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-quiet-muted italic">No tags yet. Create one below.</p>
      )}

      {/* Create form */}
      <div className="rounded-lg border border-quiet-border bg-quiet-offwhite p-4 space-y-3">
        <p className="text-xs font-medium text-quiet-slate">New tag</p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="tag-name"
          maxLength={32}
          className="w-full rounded-md border border-quiet-border bg-white px-3 py-1.5 text-sm text-quiet-slate placeholder:text-quiet-muted focus:border-quiet-accent focus:outline-none"
        />

        {/* Color picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-quiet-muted">Color</span>
          <div className="flex gap-1.5">
            {TAG_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => setColor(c.value)}
                className={`h-5 w-5 rounded-full border-2 transition-all ${
                  color === c.value ? "border-quiet-accent scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
          {name.trim() && (
            <span
              className="ml-2 rounded-full px-2.5 py-0.5 text-xs text-quiet-slate"
              style={{ backgroundColor: color }}
            >
              #{name.trim().replace(/^#+\s*/, "")}
            </span>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Button
          size="sm"
          onClick={handleCreate}
          disabled={!name.trim() || saving}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add tag
        </Button>
      </div>
    </div>
  )
}
