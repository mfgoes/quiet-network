import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Circle } from "@/types"

interface CirclePickerProps {
  circles: Circle[]
  discoverableCircles: Circle[]
  loading: boolean
  onSelect: (circle: Circle) => void
  onCreate: (name: string, description?: string) => Promise<void>
  onJoin: (circle: Circle) => Promise<void>
}

export function CirclePicker({
  circles,
  discoverableCircles,
  loading,
  onSelect,
  onCreate,
  onJoin,
}: CirclePickerProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    await onCreate(name.trim(), description.trim() || undefined)
    setName("")
    setDescription("")
    setShowCreate(false)
    setCreating(false)
  }

  const handleJoin = async (circle: Circle) => {
    setJoiningId(circle.id)
    await onJoin(circle)
    setJoiningId(null)
  }

  if (loading) {
    return (
      <p className="text-center text-sm text-quiet-muted">
        Loading your circles...
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-sm space-y-4">
      {circles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-quiet-muted">Your circles</p>
          {circles.map((circle) => (
            <button
              key={circle.id}
              onClick={() => onSelect(circle)}
              className="w-full rounded-lg border border-quiet-border bg-white p-3 text-left transition-colors hover:border-quiet-accent"
            >
              <span className="text-sm font-medium text-quiet-slate">
                {circle.name}
              </span>
              {circle.description && (
                <span className="mt-0.5 block text-xs text-quiet-muted">
                  {circle.description}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {discoverableCircles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-quiet-muted">Discover circles</p>
          {discoverableCircles.map((circle) => (
            <div
              key={circle.id}
              className="flex items-center justify-between rounded-lg border border-quiet-border bg-white p-3"
            >
              <div className="min-w-0">
                <span className="text-sm font-medium text-quiet-slate">
                  {circle.name}
                </span>
                {circle.description && (
                  <span className="mt-0.5 block text-xs text-quiet-muted">
                    {circle.description}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={joiningId === circle.id}
                onClick={() => handleJoin(circle)}
                className="ml-3 shrink-0"
              >
                {joiningId === circle.id ? "Joining..." : "Join"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {!showCreate ? (
        <Button
          variant="outline"
          onClick={() => setShowCreate(true)}
          className="w-full"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {circles.length === 0 && discoverableCircles.length === 0
            ? "Create your first circle"
            : "Create another circle"}
        </Button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-lg border border-quiet-border bg-white p-4"
        >
          <div>
            <label
              htmlFor="circle-name"
              className="mb-1 block text-sm text-quiet-muted"
            >
              Circle name
            </label>
            <input
              id="circle-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Oak Street Neighbors"
              required
              className="w-full rounded-md border border-quiet-border bg-quiet-offwhite p-2.5 text-sm text-quiet-slate focus:border-quiet-accent focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="circle-desc"
              className="mb-1 block text-sm text-quiet-muted"
            >
              Description (optional)
            </label>
            <input
              id="circle-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A quiet space for..."
              className="w-full rounded-md border border-quiet-border bg-quiet-offwhite p-2.5 text-sm text-quiet-slate focus:border-quiet-accent focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={creating}>
              Create
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
