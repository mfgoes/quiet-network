import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CircleIcon } from "@/components/CircleIcon"
import { getBannerBg } from "@/types"
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
  const [showAllOwn, setShowAllOwn] = useState(false)
  const [showAllDiscover, setShowAllDiscover] = useState(false)

  const INITIAL_SHOW = 10
  const visibleCircles = showAllOwn ? circles : circles.slice(0, INITIAL_SHOW)
  const visibleDiscoverable = showAllDiscover ? discoverableCircles : discoverableCircles.slice(0, INITIAL_SHOW)

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
        Loading circles...
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {circles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-quiet-muted">Your circles</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {visibleCircles.map((circle) => {
              const hint = getBannerBg(circle.banner_color, circle.name)
              return (
                <button
                  key={circle.id}
                  onClick={() => onSelect(circle)}
                  className="relative flex items-center gap-3 rounded-xl border border-quiet-border bg-white p-3 text-left transition-all hover:shadow-sm overflow-hidden"
                >
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl" style={{ backgroundColor: hint }} />
                  {circle.avatar_url ? (
                    <img src={circle.avatar_url} alt={circle.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <CircleIcon name={circle.name} size="lg" />
                  )}
                  <div className="min-w-0">
                    <span className="block text-sm font-medium text-quiet-slate">
                      {circle.name}
                    </span>
                    {(circle.description || circle.about) && (
                      <span className="mt-0.5 block text-xs text-quiet-muted truncate">
                        {circle.description || circle.about}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          {circles.length > INITIAL_SHOW && (
            <button
              onClick={() => setShowAllOwn(!showAllOwn)}
              className="mt-1 text-xs text-quiet-muted hover:text-quiet-slate transition-colors"
            >
              {showAllOwn ? "Show less" : `View more (${circles.length - INITIAL_SHOW} more)`}
            </button>
          )}
        </div>
      )}

      {discoverableCircles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-quiet-muted">Discover circles</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {visibleDiscoverable.map((circle) => {
              const hint = getBannerBg(circle.banner_color, circle.name)
              return (
                <div
                  key={circle.id}
                  className="relative flex items-center gap-3 rounded-xl border border-quiet-border bg-white p-3 overflow-hidden"
                >
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl" style={{ backgroundColor: hint }} />
                  <button
                    onClick={() => onSelect(circle)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left transition-all hover:opacity-80"
                  >
                    {circle.avatar_url ? (
                      <img src={circle.avatar_url} alt={circle.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                    ) : (
                      <CircleIcon name={circle.name} size="lg" />
                    )}
                    <div className="min-w-0">
                      <span className="block text-sm font-medium text-quiet-slate">
                        {circle.name}
                      </span>
                      {(circle.description || circle.about) && (
                        <span className="mt-0.5 block text-xs text-quiet-muted truncate">
                          {circle.description || circle.about}
                        </span>
                      )}
                    </div>
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={joiningId === circle.id}
                    onClick={() => handleJoin(circle)}
                    className="ml-2 shrink-0"
                  >
                    {joiningId === circle.id ? "Joining..." : "Join"}
                  </Button>
                </div>
              )
            })}
          </div>
          {discoverableCircles.length > INITIAL_SHOW && (
            <button
              onClick={() => setShowAllDiscover(!showAllDiscover)}
              className="mt-1 text-xs text-quiet-muted hover:text-quiet-slate transition-colors"
            >
              {showAllDiscover ? "Show less" : `View more (${discoverableCircles.length - INITIAL_SHOW} more)`}
            </button>
          )}
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
              Tagline (optional)
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
