'use client'

import { useEffect, useState } from "react"
import { ChevronRight, Wrench } from "lucide-react"
import { useRouter } from "next/navigation"
import { CirclePicker } from "@/components/CirclePicker"
import type { Circle } from "@/types"

const COUNTRY_CENTERS: Record<string, { lat: number; lng: number }> = {
  NL: { lat: 52.3,  lng: 5.3   },
  BE: { lat: 50.85, lng: 4.35  },
  DE: { lat: 51.1,  lng: 10.4  },
  FR: { lat: 46.6,  lng: 2.3   },
  GB: { lat: 52.5,  lng: -1.5  },
  US: { lat: 38.0,  lng: -97.0 },
  ID: { lat: -2.5,  lng: 118.0 },
}

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
  const router = useRouter()
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          if (props.userCountry && COUNTRY_CENTERS[props.userCountry]) {
            setUserLocation(COUNTRY_CENTERS[props.userCountry])
          }
        }
      )
    } else if (props.userCountry && COUNTRY_CENTERS[props.userCountry]) {
      setUserLocation(COUNTRY_CENTERS[props.userCountry])
    }
  }, [props.userCountry])

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-quiet-slate">Explore circles</h2>
      <p className="mb-4 text-sm text-quiet-muted">Join a circle to see posts from your neighborhood</p>
      <button
        onClick={() => router.push("/watchmakers")}
        className="mb-4 flex w-full items-center gap-3 rounded-xl border border-quiet-border bg-white p-4 text-left transition-colors hover:bg-quiet-aged/40"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-quiet-aged text-quiet-slate">
          <Wrench className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-quiet-slate">Watchmakers</span>
          <span className="mt-0.5 block text-xs text-quiet-muted">Find trusted watch repair near you</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-quiet-muted" />
      </button>
      <CirclePicker {...props} userLocation={userLocation} />
    </div>
  )
}
