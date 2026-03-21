'use client'

import { useEffect, useState } from "react"
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
      <CirclePicker {...props} userLocation={userLocation} />
    </div>
  )
}
