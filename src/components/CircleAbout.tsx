import { useState } from "react"
import { ChevronDown, Pencil } from "lucide-react"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import type { Circle } from "@/types"

interface CircleAboutProps {
  circle: Circle
  userId: string
  onUpdate: (updates: { about?: string | null; rules?: string | null }) => Promise<void>
  sidebar?: boolean
}

function AboutContent({
  circle,
  userId,
  onUpdate,
}: Omit<CircleAboutProps, "sidebar">) {
  const [editing, setEditing] = useState(false)
  const [about, setAbout] = useState(circle.about ?? "")
  const [rules, setRules] = useState(circle.rules ?? "")
  const [saving, setSaving] = useState(false)

  const isCreator = circle.created_by === userId
  const hasContent = circle.about || circle.rules

  const handleSave = async () => {
    setSaving(true)
    await onUpdate({
      about: about.trim() || null,
      rules: rules.trim() || null,
    })
    setEditing(false)
    setSaving(false)
  }

  const handleCancel = () => {
    setAbout(circle.about ?? "")
    setRules(circle.rules ?? "")
    setEditing(false)
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
          <label className="mb-1 block text-xs font-medium text-quiet-muted">
            Rules
          </label>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Community guidelines..."
            rows={3}
            maxLength={500}
            className="w-full rounded-md border border-quiet-border bg-quiet-offwhite px-3 py-2 text-sm text-quiet-slate placeholder:text-quiet-muted focus:outline-none focus:ring-1 focus:ring-quiet-accent resize-none"
          />
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
        <p className="text-sm text-quiet-muted">
          {isCreator
            ? "No info yet. Add a description and rules for your circle."
            : "No info added yet."}
        </p>
      )}
      {isCreator && (
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

export function CircleAbout({ circle, userId, onUpdate, sidebar }: CircleAboutProps) {
  const [open, setOpen] = useState(false)

  // Desktop sidebar: always-visible static card
  if (sidebar) {
    return (
      <div className="sticky top-8 rounded-lg border border-quiet-border bg-white">
        <div className="px-4 py-3 border-b border-quiet-border">
          <h3 className="text-sm font-medium text-quiet-slate">About / Rules</h3>
        </div>
        <div className="px-4 py-3">
          <AboutContent circle={circle} userId={userId} onUpdate={onUpdate} />
        </div>
      </div>
    )
  }

  // Mobile: collapsible
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-4">
      <div className="rounded-lg border border-quiet-border bg-white">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-quiet-slate hover:bg-quiet-aged transition-colors rounded-lg">
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
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
