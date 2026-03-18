import { useEffect, useMemo, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { Circle } from "@/types"
import { getBannerBg } from "@/types"

interface CircleMapProps {
  circles: Circle[]
  selectedId?: string | null
  joinedIds?: Set<string>
  userLocation?: { lat: number; lng: number } | null
  onSelect: (circle: Circle) => void
  onJoin: (circle: Circle) => Promise<void>
  /** Called with the set of circle IDs that have been successfully pinned */
  onPinnedIds?: (ids: Set<string>) => void
}

const COUNTRY_NAMES: Record<string, string> = {
  NL: "Netherlands", BE: "Belgium", DE: "Germany",
  FR: "France", GB: "United Kingdom", US: "United States", ID: "Indonesia",
}

// Module-level cache survives re-renders
const geoCache = new Map<string, { lat: number; lng: number } | null>()

async function geocode(name: string, country?: string | null): Promise<{ lat: number; lng: number } | null> {
  const q = country ? `${name}, ${COUNTRY_NAMES[country] ?? country}` : name
  const key = q.toLowerCase()
  if (geoCache.has(key)) return geoCache.get(key)!
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`
    const res = await fetch(url, { headers: { "Accept-Language": "en" } })
    const data = await res.json()
    const result = data[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null
    geoCache.set(key, result)
    return result
  } catch {
    geoCache.set(key, null)
    return null
  }
}

function makePinSvg(color: string, active: boolean) {
  const dot = active ? "white" : "rgba(255,255,255,0.85)"
  return `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">
    <path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 21 13 21S26 22.75 26 13C26 5.82 20.18 0 13 0z"
      fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="13" cy="13" r="5" fill="${dot}"/>
  </svg>`
}

function makeIcon(color: string, active: boolean) {
  return L.divIcon({
    html: makePinSvg(color, active),
    className: "",
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -34],
  })
}

const USER_DOT = `
  <div style="position:relative;width:20px;height:20px">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(66,133,244,0.22);animation:qn-pulse 1.8s ease-out infinite"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:12px;height:12px;border-radius:50%;background:#4285f4;border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.25)"></div>
  </div>
  <style>@keyframes qn-pulse{0%{transform:scale(.8);opacity:1}100%{transform:scale(2.5);opacity:0}}</style>
`

export function CircleMap({
  circles, selectedId, joinedIds, userLocation, onSelect, onJoin, onPinnedIds,
}: CircleMapProps) {
  const mapRef          = useRef<L.Map | null>(null)
  const markersRef      = useRef<Map<string, L.Marker>>(new Map())
  const userDotRef      = useRef<L.Marker | null>(null)
  const containerRef    = useRef<HTMLDivElement>(null)
  const onPinnedIdsRef  = useRef(onPinnedIds)
  const [locs, setLocs] = useState<Map<string, { lat: number; lng: number } | null>>(new Map())

  // Keep ref current so the markers effect doesn't need onPinnedIds in its deps
  useEffect(() => { onPinnedIdsRef.current = onPinnedIds }, [onPinnedIds])

  // Stable joined-ids string to avoid re-running markers on every render
  const joinedKey = useMemo(
    () => [...(joinedIds ?? new Set())].sort().join(","),
    [joinedIds]
  )
  const joinedSet = useMemo(() => joinedIds ?? new Set<string>(), [joinedKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const center: L.LatLngExpression = userLocation ? [userLocation.lat, userLocation.lng] : [51.8, 8]
    const zoom = userLocation ? 8 : 5

    const map = L.map(containerRef.current, { zoomControl: true, preferCanvas: true })
      .setView(center, zoom)

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 18,
    }).addTo(map)

    mapRef.current = map

    // Give the DOM a frame to settle, then fix tile rendering
    setTimeout(() => map.invalidateSize(), 50)

    return () => { map.remove(); mapRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Also invalidate when userLocation arrives (map may have mounted before location resolved)
  useEffect(() => {
    mapRef.current?.invalidateSize()
  }, [userLocation])

  // Geocode circles progressively (rate-limited to 1/sec for Nominatim)
  useEffect(() => {
    let cancelled = false
    async function run() {
      for (const c of circles) {
        if (cancelled) break
        // Use DB coords if present
        if (c.latitude != null && c.longitude != null) {
          setLocs(prev => new Map(prev).set(c.id, { lat: c.latitude!, lng: c.longitude! }))
          continue
        }
        // Already cached
        const q = c.country ? `${c.name}, ${COUNTRY_NAMES[c.country] ?? c.country}` : c.name
        const key = q.toLowerCase()
        if (geoCache.has(key)) {
          setLocs(prev => new Map(prev).set(c.id, geoCache.get(key)!))
          continue
        }
        const loc = await geocode(c.name, c.country)
        if (!cancelled) setLocs(prev => new Map(prev).set(c.id, loc))
        await new Promise(r => setTimeout(r, 1100))
      }
    }
    run()
    return () => { cancelled = true }
  }, [circles])

  // User location dot
  useEffect(() => {
    const map = mapRef.current
    if (!map || !userLocation) return
    const icon = L.divIcon({ html: USER_DOT, className: "", iconSize: [20, 20], iconAnchor: [10, 10] })
    if (userDotRef.current) {
      userDotRef.current.setLatLng([userLocation.lat, userLocation.lng])
    } else {
      userDotRef.current = L.marker([userLocation.lat, userLocation.lng], { icon, zIndexOffset: 1000 })
        .bindTooltip("You are here", { permanent: false, direction: "top", offset: [0, -12] })
        .addTo(map)
      map.flyTo([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 8), { animate: true, duration: 1 })
    }
  }, [userLocation])

  // Sync circle markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const seen = new Set<string>()
    const pinned = new Set<string>()

    for (const circle of circles) {
      const loc = locs.get(circle.id)
      if (!loc) continue
      seen.add(circle.id)
      pinned.add(circle.id)

      const color    = getBannerBg(circle.banner_color, circle.name)
      const active   = circle.id === selectedId
      const isMember = joinedSet.has(circle.id)

      let marker = markersRef.current.get(circle.id)
      if (!marker) {
        marker = L.marker([loc.lat, loc.lng], { icon: makeIcon(color, active) }).addTo(map)
        marker.bindPopup(L.popup({ closeButton: false, offset: [0, -32], minWidth: 160 }))
        marker.on("mouseover", () => marker!.openPopup())
        marker.on("mouseout", () => { if (circle.id !== selectedId) marker!.closePopup() })
        marker.on("click", () => isMember ? onSelect(circle) : onJoin(circle))
        markersRef.current.set(circle.id, marker)
      } else {
        marker.setIcon(makeIcon(color, active))
      }

      const actionLabel = isMember ? "View" : "Join"
      const actionColor = isMember ? "#718096" : "#667eea"
      marker.getPopup()?.setContent(`
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-width:150px">
          <div style="font-weight:700;font-size:.88rem;color:#2d3748;margin-bottom:2px">${circle.name}</div>
          ${circle.description ? `<div style="font-size:.75rem;color:#718096;margin-bottom:6px;line-height:1.4">${circle.description.substring(0, 70)}${circle.description.length > 70 ? "…" : ""}</div>` : ""}
          <button onclick="window.__circleMapAction('${circle.id}')"
            style="background:${actionColor};color:white;border:none;border-radius:6px;padding:4px 12px;font-size:.78rem;font-weight:600;cursor:pointer;width:100%">${actionLabel}</button>
        </div>`)
    }

    // Remove stale markers
    for (const [id, m] of markersRef.current) {
      if (!seen.has(id)) { m.remove(); markersRef.current.delete(id) }
    }

    onPinnedIdsRef.current?.(pinned)
  }, [circles, locs, selectedId, joinedSet, onSelect, onJoin])

  // Fly to selected
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const m = markersRef.current.get(selectedId)
    if (m) {
      map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 10), { animate: true, duration: 0.7 })
      m.openPopup()
    }
  }, [selectedId])

  // Popup button bridge
  useEffect(() => {
    const cm = new Map(circles.map(c => [c.id, c]))
    ;(window as any).__circleMapAction = (id: string) => {
      const c = cm.get(id)
      if (!c) return
      joinedSet.has(id) ? onSelect(c) : onJoin(c)
    }
    return () => { delete (window as any).__circleMapAction }
  }, [circles, joinedSet, onSelect, onJoin])

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: "100%" }}
      className="rounded-xl overflow-hidden border border-quiet-border"
    />
  )
}
