import { CirclePicker } from "@/components/CirclePicker"
import type { Circle } from "@/types"

interface ExplorePageProps {
  circles: Circle[]
  discoverableCircles: Circle[]
  loading: boolean
  onSelect: (circle: Circle) => void
  onCreate: (name: string, description?: string) => Promise<void>
  onJoin: (circle: Circle) => Promise<void>
}

export function ExplorePage(props: ExplorePageProps) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-quiet-slate">
        Explore circles
      </h2>
      <CirclePicker {...props} />
    </div>
  )
}
