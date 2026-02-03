import { useState, useRef, useEffect, useMemo, useCallback } from "react" // Added useCallback
import { Link, useNavigate } from "react-router-dom" // Added useNavigate back
import { ChevronDown, Star } from "lucide-react" // Import Star icon
import { CircleIcon } from "@/components/CircleIcon"
import type { Circle } from "@/types"

// Popover components are not used in the provided CircleDropdown, so removing their imports
// import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"


interface CircleDropdownProps {
  circles: Circle[]
  selectedSlug?: string
  currentCircle?: Circle | null
  userId: string
  favoritedCircleIds?: string[]
  onToggleFavorite?: (circleId: string, e: React.MouseEvent) => void
}

export function CircleDropdown({ 
  circles, 
  selectedSlug, 
  currentCircle, 
  userId,
  favoritedCircleIds = [],
  onToggleFavorite
}: CircleDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const sortedCircles = useMemo(() => {
    const favorites = circles.filter(circle => favoritedCircleIds.includes(circle.id));
    const nonFavorites = circles.filter(circle => !favoritedCircleIds.includes(circle.id));
    return [...favorites, ...nonFavorites];
  }, [circles, favoritedCircleIds]);

  const label = selectedSlug
    ? circles.find((c) => c.slug === selectedSlug) ?? currentCircle ?? null
    : null

  const triggerButtonLabel = label ? label.name : "All circles"

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-lg font-semibold text-quiet-slate hover:text-quiet-accent transition-colors"
      >
        {triggerButtonLabel}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] rounded-lg border border-quiet-border bg-white shadow-lg py-1">
          <button
            onClick={() => {
              navigate("/")
              setOpen(false)
            }}
            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
              !selectedSlug
                ? "bg-quiet-aged text-quiet-slate font-medium"
                : "text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate"
            }`}
          >
            All circles
          </button>
          {sortedCircles.map((circle) => { // Use sortedCircles here
            const isFavorited = favoritedCircleIds.includes(circle.id);
            return (
              <div // Changed from Link to div to wrap both Link and button
                key={circle.id}
                className={`flex items-center justify-between w-full rounded-lg text-sm transition-colors ${
                  selectedSlug === circle.slug
                    ? "bg-quiet-aged text-quiet-slate font-medium"
                    : "text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate"
                }`}
              >
                <Link
                  to={`/${circle.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 flex-grow" // flex-grow to take available space
                >
                  <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="sm" />
                  <span className="truncate">{circle.name}</span>
                </Link>
                <button
                  onClick={(e) => onToggleFavorite?.(circle.id, e)}
                  className="p-2 rounded-full hover:bg-quiet-border/50 mr-2 group/star"
                  aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                  title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star className={`h-4 w-4 ${isFavorited ? "text-yellow-500 fill-current" : "text-quiet-muted"}`} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
