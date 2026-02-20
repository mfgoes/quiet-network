import { CirclePicker } from "@/components/CirclePicker"
import type { Circle } from "@/types"

interface ExplorePageProps {
  circles: Circle[]
  discoverableCircles: Circle[]
  userCountry: string | null
  loading: boolean
  onSelect: (circle: Circle) => void
  onCreate: (name: string, description?: string) => Promise<void>
  onJoin: (circle: Circle) => Promise<void>
  onSetLocation: () => void
}

export function ExplorePage(props: ExplorePageProps) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-quiet-slate">
        Explore circles
      </h2>
      <p className="mb-6 text-sm text-quiet-muted">
        Join a circle to see posts from your neighborhood
      </p>
      <CirclePicker {...props} />
    </div>
  )
}
