import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { CircleIcon } from "@/components/CircleIcon"
import { Star } from "lucide-react"
import type { Circle } from "@/types"

export function Shell({
  children,
  leading,
  wide,
  circles,
  userId,
}: {
  children: React.ReactNode
  leading?: React.ReactNode
  wide?: boolean
  circles?: Circle[]
  userId?: string
}) {
  const [favoritedCircleIds, setFavoritedCircleIds] = useState<string[]>([])

  // Load favorites from localStorage on mount
  useEffect(() => {
    if (userId) {
      const storedFavorites = localStorage.getItem(`favorites_${userId}`)
      if (storedFavorites) {
        setFavoritedCircleIds(JSON.parse(storedFavorites))
      }
    }
  }, [userId])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`favorites_${userId}`, JSON.stringify(favoritedCircleIds))
    }
  }, [favoritedCircleIds, userId])

  const toggleFavorite = useCallback((circleId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setFavoritedCircleIds(prev => {
      if (prev.includes(circleId)) {
        return prev.filter(id => id !== circleId)
      } else {
        return [...prev, circleId]
      }
    })
  }, [])

  const favoriteCircles = circles?.filter(c => favoritedCircleIds.includes(c.id)) || []
  const otherCircles = circles?.filter(c => !favoritedCircleIds.includes(c.id)) || []
  return (
    <div className={`mx-auto min-h-screen bg-quiet-offwhite px-4 pb-20 pt-8 md:pb-8 ${wide ? "max-w-4xl" : "max-w-xl"}`}>
      <div className="flex min-h-screen">
        {/* Side Navigation */}
        {circles && circles.length > 0 && (
          <nav className="hidden md:block w-64 p-6 border-r border-quiet-border">
            <div className="space-y-6">
              {favoriteCircles.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-quiet-muted mb-2">FAVORITES</h3>
                  <div className="space-y-1">
                    {favoriteCircles.map(circle => (
                      <div key={circle.id} className="flex items-center">
                        <Link
                          to={`/${circle.slug}`}
                          className="flex flex-1 items-center gap-2 px-3 py-2 rounded-lg text-sm text-quiet-slate hover:bg-quiet-aged"
                        >
                          <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="sm" />
                          <span className="truncate">{circle.name}</span>
                        </Link>
                        <button
                          onClick={(e) => toggleFavorite(circle.id, e)}
                          className="p-2 rounded-full hover:bg-quiet-border/50 mr-2 group/star"
                          aria-label={favoritedCircleIds.includes(circle.id) ? "Remove from favorites" : "Add to favorites"}
                          title={favoritedCircleIds.includes(circle.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star className={`h-4 w-4 ${favoritedCircleIds.includes(circle.id) ? "text-yellow-500 fill-current" : "text-quiet-muted"}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-xs font-medium text-quiet-muted mb-2">ALL CIRCLES</h3>
                <div className="space-y-1">
                  {otherCircles.map(circle => (
                    <div key={circle.id} className="flex items-center">
                      <Link
                        to={`/${circle.slug}`}
                        className="flex flex-1 items-center gap-2 px-3 py-2 rounded-lg text-sm text-quiet-slate hover:bg-quiet-aged"
                      >
                        <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="sm" />
                        <span className="truncate">{circle.name}</span>
                      </Link>
                      <button
                        onClick={(e) => toggleFavorite(circle.id, e)}
                        className="p-2 rounded-full hover:bg-quiet-border/50 mr-2"
                        aria-label={favoritedCircleIds.includes(circle.id) ? "Unfavorite" : "Favorite"}
                      >
                        <Star className={`h-4 w-4 ${favoritedCircleIds.includes(circle.id) ? "text-yellow-500 fill-current" : "text-quiet-muted"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        )}

        {/* Main Content */}
        <div className="flex-1">
          <header className="mb-8 flex items-center justify-between p-4">
            <div className="w-9">{leading}</div>
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-quiet-slate">
                Quiet Network
              </h1>
              <p className="mt-0.5 text-sm text-quiet-muted">
                Your neighborhood, without the noise
              </p>
            </div>
            <div className="w-9" />
          </header>
          {children}
        </div>
      </div>
    </div>
  )
}
