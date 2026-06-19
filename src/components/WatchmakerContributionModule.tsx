'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { MessageSquareText, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export type ContributionType = 'watchmaker' | 'report'
type ReportWatchType = 'genuine' | 'replica'
type ShopRecord = {
  id: string
  name: string
  city: string
  address: string
}
type NominatimResult = {
  place_id: number
  osm_type?: 'node' | 'way' | 'relation'
  lat: string
  lon: string
  display_name: string
}
type SelectedLocation = {
  place_id: number
  osm_type?: 'node' | 'way' | 'relation'
  lat: string
  lon: string
  display_name: string
}
type WatchmakerContributionModuleProps = {
  open: boolean
  initialType: ContributionType
  shops: ShopRecord[]
  onClose: () => void
}

const WORK_DONE = ['Full service', 'Regulation', 'Pressure test', 'Battery', 'Crystal', 'Polish']
const RETURN_OPTIONS = ['Yes', 'Probably', 'No']
const REPORT_WATCH_TYPES: Array<{ label: string; value: ReportWatchType }> = [
  { label: 'Genuine', value: 'genuine' },
  { label: 'Rep / replica', value: 'replica' },
]

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function slugify(value: string): string {
  return normalize(value).replace(/\s+/g, '-')
}

function uniqueSlug(value: string): string {
  const base = slugify(value) || 'watchmaker'
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  return `${base}-${suffix}`
}

function similarity(a: string, b: string): number {
  const left = normalize(a)
  const right = normalize(b)
  if (!left || !right) return 0
  if (left === right) return 1
  if (right.includes(left) || left.includes(right)) return 0.9

  const leftTokens = new Set(left.split(' '))
  const rightTokens = new Set(right.split(' '))
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length
  return overlap / Math.max(leftTokens.size, rightTokens.size)
}

function formValue(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

function locationParts(location: SelectedLocation): { city: string; country: string } {
  const parts = location.display_name
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  return {
    city: parts.length > 1 ? parts[Math.max(0, parts.length - 3)] : parts[0] || 'Unknown',
    country: parts.at(-1) || 'Unknown',
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  return 'Something went wrong while saving this contribution.'
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        selected
          ? 'border-quiet-slate bg-quiet-slate text-white'
          : 'border-quiet-border bg-quiet-offwhite text-quiet-slate hover:bg-quiet-border/50'
      }`}
    >
      {label}
    </button>
  )
}

export function WatchmakerContributionModule({
  open,
  initialType,
  shops,
  onClose,
}: WatchmakerContributionModuleProps) {
  const [type, setType] = useState<ContributionType>(initialType)
  const [message, setMessage] = useState('')
  const [messageKind, setMessageKind] = useState<'success' | 'error'>('success')
  const [shopQuery, setShopQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<NominatimResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [workDone, setWorkDone] = useState<string[]>([])
  const [reportWatchType, setReportWatchType] = useState<ReportWatchType>('genuine')
  const [wouldReturn, setWouldReturn] = useState('Yes')

  useEffect(() => {
    if (!open) return
    setType(initialType)
    setMessage('')
    setMessageKind('success')
    setShopQuery('')
    setLocationQuery('')
    setLocationResults([])
    setSelectedLocation(null)
    setLocationLoading(false)
    setSubmitting(false)
    setWorkDone([])
    setReportWatchType('genuine')
    setWouldReturn('Yes')
  }, [initialType, open])

  const matchedShop = useMemo(() => {
    if (type !== 'report' || shopQuery.trim().length < 3) return null
    const best = shops
      .map((shop) => ({
        shop,
        score: Math.max(
          similarity(shopQuery, shop.name),
          similarity(shopQuery, `${shop.name} ${shop.city}`),
          similarity(shopQuery, shop.address),
        ),
      }))
      .sort((a, b) => b.score - a.score)[0]

    return best && best.score >= 0.7 ? best.shop : null
  }, [shopQuery, shops, type])
  const needsLocationSearch = type === 'watchmaker' || (type === 'report' && !matchedShop)

  useEffect(() => {
    if (!needsLocationSearch || selectedLocation || locationQuery.trim().length < 3) {
      setLocationResults([])
      setLocationLoading(false)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      setLocationLoading(true)
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=5`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : []))
        .then((results: NominatimResult[]) => setLocationResults(Array.isArray(results) ? results : []))
        .catch(() => {
          if (!controller.signal.aborted) setLocationResults([])
        })
        .finally(() => {
          if (!controller.signal.aborted) setLocationLoading(false)
        })
    }, 300)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [locationQuery, needsLocationSearch, selectedLocation])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setMessageKind('success')

    const formData = new FormData(event.currentTarget)
    const shopName = shopQuery.trim()

    if (!shopName) {
      setMessage('Add the shop or watchmaker name before submitting.')
      setMessageKind('error')
      return
    }

    if (needsLocationSearch && !selectedLocation) {
      setMessage(
        type === 'watchmaker'
          ? 'Choose a location result before submitting this community listing.'
          : 'Choose a location result before submitting this report.',
      )
      setMessageKind('error')
      return
    }

    if (type === 'report' && workDone.length === 0) {
      setMessage('Choose at least one work item from the report.')
      setMessageKind('error')
      return
    }

    setSubmitting(true)

    try {
      if (type === 'watchmaker') {
        if (!selectedLocation) return

        const { city, country } = locationParts(selectedLocation)
        const { error } = await supabase.from('watchmakers').insert({
          name: shopName,
          slug: uniqueSlug(`${shopName} ${city}`),
          profile_type: 'community',
          owner_id: null,
          city,
          country,
          address: selectedLocation.display_name,
          website: formValue(formData, 'website') || null,
          description: formValue(formData, 'notes') || null,
          services: [],
          watch_types: [],
          osm_place_id: selectedLocation.place_id,
          osm_type: selectedLocation.osm_type ?? null,
          osm_display_name: selectedLocation.display_name,
          latitude: Number(selectedLocation.lat),
          longitude: Number(selectedLocation.lon),
          approved: false,
        })

        if (error) throw error
      } else {
        const watch = formValue(formData, 'watch')
        if (!watch) {
          setMessage('Add the watch, model, movement, or type before submitting this report.')
          setMessageKind('error')
          return
        }

        const locationPayload = selectedLocation
          ? {
              osm_place_id: selectedLocation.place_id,
              osm_type: selectedLocation.osm_type ?? null,
              osm_display_name: selectedLocation.display_name,
              latitude: Number(selectedLocation.lat),
              longitude: Number(selectedLocation.lon),
            }
          : {}
        const { error } = await supabase.from('watchmaker_service_reports').insert({
          watchmaker_id: matchedShop && isUuid(matchedShop.id) ? matchedShop.id : null,
          watchmaker_slug: matchedShop ? matchedShop.id : null,
          watchmaker_name: matchedShop ? matchedShop.name : shopName,
          watch,
          watch_type: reportWatchType,
          work_done: workDone,
          work_performed: workDone.join(', '),
          watch_accepted: formData.get('watchAccepted') === 'on',
          price: formValue(formData, 'price') || null,
          turnaround: formValue(formData, 'turnaround') || null,
          would_return: wouldReturn !== 'No',
          notes: formValue(formData, 'notes') || null,
          approved: false,
          ...locationPayload,
        })

        if (error) throw error
      }

      setMessageKind('success')
      setMessage(type === 'watchmaker' ? 'Community listing saved for review.' : 'Service report saved for review.')
    } catch (error) {
      setMessageKind('error')
      setMessage(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const toggle = (value: string, values: string[], setter: (next: string[]) => void) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }

  if (!open) return null

  return (
    <section
      id="contribute"
      className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="watchmaker-contribution-title"
      onClick={onClose}
    >
      <div className="mx-auto flex min-h-full w-full max-w-2xl items-center">
        <form
          onSubmit={handleSubmit}
          onClick={(event) => event.stopPropagation()}
          className="w-full rounded-lg border border-quiet-border bg-white p-4 shadow-2xl sm:p-5"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-quiet-muted">Community knowledge</p>
              <h2 id="watchmaker-contribution-title" className="mt-2 text-xl font-semibold text-quiet-slate">
                Add what helps the next collector.
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-quiet-muted">
                Keep it practical: who handled the watch, what they did, price or timing if you know it, and whether you would go back.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-quiet-muted transition hover:bg-quiet-aged hover:text-quiet-slate"
              aria-label="Close contribution form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setType('watchmaker')}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                type === 'watchmaker' ? 'bg-quiet-slate text-white' : 'bg-quiet-aged text-quiet-slate hover:bg-quiet-border/60'
              }`}
            >
              <Plus className="h-4 w-4" />
              Community listing
            </button>
            <button
              type="button"
              onClick={() => setType('report')}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                type === 'report' ? 'bg-quiet-slate text-white' : 'bg-quiet-aged text-quiet-slate hover:bg-quiet-border/60'
              }`}
            >
              <MessageSquareText className="h-4 w-4" />
              Service report
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-quiet-slate">
              Shop or watchmaker
              <input
                value={shopQuery}
                onChange={(event) => {
                  setShopQuery(event.target.value)
                  setSelectedLocation(null)
                }}
                className="mt-1 h-10 w-full rounded-md border border-quiet-border bg-quiet-offwhite px-3 text-sm text-quiet-slate outline-none focus:border-quiet-accent"
                placeholder="e.g. Van Dijk Watch Service"
              />
              {type === 'report' && matchedShop && (
                <span className="mt-1 block text-xs font-medium text-emerald-700">
                  Matched existing shop: {matchedShop.name}. This report will use shop ID {matchedShop.id}.
                </span>
              )}
            </label>
            {needsLocationSearch ? (
              <div className="relative text-sm font-medium text-quiet-slate">
                Location
                <input
                  value={selectedLocation ? selectedLocation.display_name : locationQuery}
                  onChange={(event) => {
                    setSelectedLocation(null)
                    setLocationQuery(event.target.value)
                  }}
                  className="mt-1 h-10 w-full rounded-md border border-quiet-border bg-quiet-offwhite px-3 text-sm text-quiet-slate outline-none focus:border-quiet-accent"
                  placeholder="Search street address or place"
                />
                <span className="mt-1 block text-xs text-quiet-muted">Choose an OpenStreetMap result. Free text is not saved.</span>
                {(locationResults.length > 0 || locationLoading) && !selectedLocation && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-quiet-border bg-white shadow-lg">
                    {locationLoading && <p className="px-3 py-2 text-xs text-quiet-muted">Searching...</p>}
                    {locationResults.map((result) => (
                      <button
                        key={result.place_id}
                        type="button"
                        onClick={() => {
                          setSelectedLocation({
                            place_id: result.place_id,
                            osm_type: result.osm_type,
                            lat: result.lat,
                            lon: result.lon,
                            display_name: result.display_name,
                          })
                          setLocationQuery(result.display_name)
                          setLocationResults([])
                        }}
                        className="block w-full px-3 py-2 text-left text-xs text-quiet-slate hover:bg-quiet-aged"
                      >
                        {result.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {type === 'watchmaker' ? (
            <>
              <label className="mt-3 block text-sm font-medium text-quiet-slate">
                Contact or website
                <input
                  name="website"
                  className="mt-1 h-10 w-full rounded-md border border-quiet-border bg-quiet-offwhite px-3 text-sm text-quiet-slate outline-none focus:border-quiet-accent"
                  placeholder="Website, phone, or Instagram"
                />
              </label>
            </>
          ) : (
            <>
              <label className="mt-3 block text-sm font-medium text-quiet-slate">
                Watch
                <input
                  name="watch"
                  className="mt-1 h-10 w-full rounded-md border border-quiet-border bg-quiet-offwhite px-3 text-sm text-quiet-slate outline-none focus:border-quiet-accent"
                  placeholder="Brand, model, movement, or type"
                />
              </label>
              <div className="mt-4">
                <p className="text-sm font-medium text-quiet-slate">Watch type</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {REPORT_WATCH_TYPES.map((item) => (
                    <Chip
                      key={item.value}
                      label={item.label}
                      selected={reportWatchType === item.value}
                      onClick={() => setReportWatchType(item.value)}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-quiet-slate">Work done</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WORK_DONE.map((item) => (
                    <Chip
                      key={item}
                      label={item}
                      selected={workDone.includes(item)}
                      onClick={() => toggle(item, workDone, setWorkDone)}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-quiet-slate">
                  Cost
                  <input
                    name="price"
                    className="mt-1 h-10 w-full rounded-md border border-quiet-border bg-quiet-offwhite px-3 text-sm text-quiet-slate outline-none focus:border-quiet-accent"
                    placeholder="e.g. EUR 220"
                  />
                </label>
                <label className="text-sm font-medium text-quiet-slate">
                  Turnaround
                  <input
                    name="turnaround"
                    className="mt-1 h-10 w-full rounded-md border border-quiet-border bg-quiet-offwhite px-3 text-sm text-quiet-slate outline-none focus:border-quiet-accent"
                    placeholder="e.g. 3 weeks"
                  />
                </label>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-quiet-slate">Would you return?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {RETURN_OPTIONS.map((item) => (
                    <Chip
                      key={item}
                      label={item}
                      selected={wouldReturn === item}
                      onClick={() => setWouldReturn(item)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <label className="mt-4 block text-sm font-medium text-quiet-slate">
            Notes
            <textarea
              name="notes"
              rows={3}
              className="mt-1 w-full resize-none rounded-md border border-quiet-border bg-quiet-offwhite px-3 py-2 text-sm text-quiet-slate outline-none focus:border-quiet-accent"
              placeholder={
                type === 'watchmaker'
                  ? 'Anything a collector should know before contacting them?'
                  : 'Communication, quality, parts, pressure test result, or any caveats...'
              }
            />
          </label>

          {type === 'report' && (
            <label className="mt-3 flex items-center gap-2 text-sm font-medium text-quiet-slate">
              <input name="watchAccepted" type="checkbox" className="h-4 w-4 rounded border-quiet-border text-quiet-slate" />
              This shop accepted the watch in my case
            </label>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={submitting} className="bg-quiet-slate hover:bg-quiet-slate/90">
              {submitting ? 'Saving...' : type === 'watchmaker' ? 'Submit community listing' : 'Submit report'}
            </Button>
            <p className="text-xs text-quiet-muted">Anonymous for now.</p>
          </div>

          {message && (
            <p
              className={`mt-4 rounded-md border px-3 py-2 text-sm font-medium ${
                messageKind === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </section>
  )
}
