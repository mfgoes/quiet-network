'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  Bookmark,
  Check,
  ChevronDown,
  Crosshair,
  Droplets,
  HeartHandshake,
  ListFilter,
  MapPin,
  Menu,
  MessageSquareText,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WatchmakerContributionModule, type ContributionType } from '@/components/WatchmakerContributionModule'
import { useAuth } from '@/lib/hooks'
import { supabase } from '@/lib/supabase'

type ProfileType = 'claimed' | 'community'
type ReplicaPolicy = 'yes' | 'no' | 'unknown'

type ServiceReport = {
  title: string
  watch: string
  work: string
  price: string
  turnaround: string
  wouldReturn: boolean
  watchAccepted?: boolean
}

type WatchmakerBase = {
  id: string
  profileType: ProfileType
  slug?: string | null
  ownerId?: string | null
  name: string
  city: string
  country: string
  address: string
  type: string
  distanceKm: number
  rating: number
  reviews: number
  featured?: boolean
  description: string
  movements: string[]
  price: string
  priceBucket: 'under150' | '150to400' | 'over400'
  turnaround: string
  turnaroundBucket: 'under1' | '1to4' | 'over4'
  x: number
  y: number
  reports: ServiceReport[]
  website?: string | null
}

type ClaimedWatchmaker = WatchmakerBase & {
  profileType: 'claimed'
  repFriendly: ReplicaPolicy
  services: string[]
  watchTypes: string[]
}

type ClaimedWatchmakerWithReplicaPolicy = ClaimedWatchmaker & {
  repFriendly: Exclude<ReplicaPolicy, 'unknown'>
}

type CommunityWatchmaker = WatchmakerBase & {
  profileType: 'community'
  services?: never
  watchTypes?: never
}

type Watchmaker = ClaimedWatchmaker | CommunityWatchmaker
type DbWatchmakerRow = {
  id: string
  slug: string | null
  profile_type: ProfileType
  owner_id: string | null
  name: string
  city: string
  country: string
  address: string | null
  website: string | null
  description: string | null
  shop_type: string | null
  services: string[] | null
  watch_types: string[] | null
  movements: string[] | null
  rep_friendly: ReplicaPolicy | null
  typical_price: string | null
  turnaround: string | null
  latitude: number | null
  longitude: number | null
}
type DbServiceReportRow = {
  id: string
  watchmaker_id: string | null
  watchmaker_slug: string | null
  watchmaker_name: string | null
  watch: string
  work_performed: string
  price: string | null
  turnaround: string | null
  would_return: boolean | null
  watch_accepted: boolean | null
}
type GeoLookup = {
  city?: string
  country?: string
  countryCode?: string
  lat?: number
  lon?: number
}
type CitySuggestion = {
  city: string
  country: string
  countryCode: string
  lat: number
  lon: number
}

const SERVICE_FILTERS = [
  'Mechanical service',
  'Vintage restoration',
  'Pressure testing',
  'Polishing',
  'Regulation',
  'Water resistance',
  'Battery service',
]

const WATCH_TYPE_FILTERS = ['Rolex', 'Omega', 'Seiko', 'Tudor', 'Microbrands', 'Vintage']

const KNOWN_BRANDS = ['Rolex', 'Omega', 'Seiko', 'Tudor', 'Tissot', 'Microbrands', 'Vintage'] as const
const MAJOR_CITY_SUGGESTIONS: CitySuggestion[] = [
  { city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', lat: 52.3676, lon: 4.9041 },
  { city: 'Rotterdam', country: 'Netherlands', countryCode: 'NL', lat: 51.9244, lon: 4.4777 },
  { city: 'The Hague', country: 'Netherlands', countryCode: 'NL', lat: 52.0705, lon: 4.3007 },
  { city: 'Utrecht', country: 'Netherlands', countryCode: 'NL', lat: 52.0907, lon: 5.1214 },
  { city: 'Eindhoven', country: 'Netherlands', countryCode: 'NL', lat: 51.4416, lon: 5.4697 },
  { city: 'New York', country: 'United States', countryCode: 'US', lat: 40.7128, lon: -74.006 },
  { city: 'Los Angeles', country: 'United States', countryCode: 'US', lat: 34.0522, lon: -118.2437 },
  { city: 'Chicago', country: 'United States', countryCode: 'US', lat: 41.8781, lon: -87.6298 },
  { city: 'Houston', country: 'United States', countryCode: 'US', lat: 29.7604, lon: -95.3698 },
  { city: 'San Francisco', country: 'United States', countryCode: 'US', lat: 37.7749, lon: -122.4194 },
  { city: 'London', country: 'United Kingdom', countryCode: 'GB', lat: 51.5072, lon: -0.1276 },
  { city: 'Manchester', country: 'United Kingdom', countryCode: 'GB', lat: 53.4808, lon: -2.2426 },
  { city: 'Birmingham', country: 'United Kingdom', countryCode: 'GB', lat: 52.4862, lon: -1.8904 },
  { city: 'Berlin', country: 'Germany', countryCode: 'DE', lat: 52.52, lon: 13.405 },
  { city: 'Munich', country: 'Germany', countryCode: 'DE', lat: 48.1351, lon: 11.582 },
  { city: 'Hamburg', country: 'Germany', countryCode: 'DE', lat: 53.5511, lon: 9.9937 },
  { city: 'Paris', country: 'France', countryCode: 'FR', lat: 48.8566, lon: 2.3522 },
  { city: 'Lyon', country: 'France', countryCode: 'FR', lat: 45.764, lon: 4.8357 },
  { city: 'Marseille', country: 'France', countryCode: 'FR', lat: 43.2965, lon: 5.3698 },
  { city: 'Toronto', country: 'Canada', countryCode: 'CA', lat: 43.6532, lon: -79.3832 },
  { city: 'Vancouver', country: 'Canada', countryCode: 'CA', lat: 49.2827, lon: -123.1207 },
  { city: 'Montreal', country: 'Canada', countryCode: 'CA', lat: 45.5019, lon: -73.5674 },
  { city: 'Sydney', country: 'Australia', countryCode: 'AU', lat: -33.8688, lon: 151.2093 },
  { city: 'Melbourne', country: 'Australia', countryCode: 'AU', lat: -37.8136, lon: 144.9631 },
  { city: 'Tokyo', country: 'Japan', countryCode: 'JP', lat: 35.6762, lon: 139.6503 },
  { city: 'Osaka', country: 'Japan', countryCode: 'JP', lat: 34.6937, lon: 135.5023 },
  { city: 'Singapore', country: 'Singapore', countryCode: 'SG', lat: 1.3521, lon: 103.8198 },
]

const WATCHMAKERS: Watchmaker[] = [
  {
    id: 'van-dijk',
    profileType: 'community',
    name: 'Van Dijk Watch Service',
    city: 'Amsterdam',
    country: 'Netherlands',
    address: 'Prinsengracht 645, 1016 HV Amsterdam',
    type: 'Independent watchmaker',
    distanceKm: 0.6,
    rating: 4.8,
    reviews: 23,
    featured: true,
    description:
      'Independent bench specializing in mechanical service and sympathetic vintage restoration for Swiss and Japanese timepieces.',
    movements: ['ETA', 'Sellita', 'Seiko NH', 'Miyota', 'Omega 1120'],
    price: 'EUR 250 - EUR 450',
    priceBucket: '150to400',
    turnaround: '3 - 4 weeks',
    turnaroundBucket: '1to4',
    x: 43,
    y: 43,
    reports: [
      {
        title: 'Seiko SKX007 full service',
        watch: 'Seiko SKX007',
        work: 'Full service, pressure test, regulation',
        price: 'EUR 220',
        turnaround: '5 days',
        wouldReturn: true,
        watchAccepted: true,
      },
      {
        title: 'Vintage Omega regulation',
        watch: 'Omega Geneve',
        work: 'Regulation and water resistance check',
        price: 'EUR 65',
        turnaround: '2 days',
        wouldReturn: true,
        watchAccepted: true,
      },
    ],
  },
  {
    id: 'amsterdam-timeworks',
    profileType: 'claimed',
    name: 'Amsterdam Timeworks',
    city: 'Amsterdam',
    country: 'Netherlands',
    address: 'Haarlemmerdijk 88, 1013 JE Amsterdam',
    type: 'Microbrand friendly workshop',
    distanceKm: 1.2,
    rating: 4.5,
    reviews: 12,
    repFriendly: 'yes',
    description:
      'A practical shop for microbrands, Seiko builds, NH movements, quartz diagnostics, and honest second opinions.',
    services: ['Pressure testing', 'Regulation', 'Water resistance', 'Battery service'],
    watchTypes: ['Seiko', 'Microbrands', 'Tudor'],
    movements: ['Seiko NH', 'Miyota 9000', 'Ronda', 'Sellita'],
    price: 'EUR 180 - EUR 250',
    priceBucket: '150to400',
    turnaround: '7 - 14 days',
    turnaroundBucket: '1to4',
    x: 32,
    y: 31,
    reports: [
      {
        title: 'Clean GMT pressure test',
        watch: 'Clean GMT Master II',
        work: 'Regulation and pressure test',
        price: 'EUR 40',
        turnaround: '2 days',
        wouldReturn: true,
        watchAccepted: true,
      },
    ],
  },
  {
    id: 'horlogerie-amsterdam',
    profileType: 'claimed',
    name: 'Horlogerie Amsterdam',
    city: 'Amsterdam',
    country: 'Netherlands',
    address: 'Utrechtsestraat 23, 1017 VH Amsterdam',
    type: 'Vintage specialist',
    distanceKm: 1.5,
    rating: 4.7,
    reviews: 18,
    repFriendly: 'no',
    description:
      'Careful restoration for vintage dress watches, chronographs, and heirloom pieces where originality matters.',
    services: ['Vintage restoration', 'Mechanical service', 'Polishing'],
    watchTypes: ['Omega', 'Vintage', 'Rolex', 'Tudor'],
    movements: ['Lemania', 'Valjoux', 'Omega 5xx', 'ETA'],
    price: 'EUR 300 - EUR 600',
    priceBucket: 'over400',
    turnaround: '2 - 4 weeks',
    turnaroundBucket: '1to4',
    x: 58,
    y: 36,
    reports: [
      {
        title: 'Omega Seamaster crystal and service',
        watch: 'Omega Seamaster 166.010',
        work: 'Service, crystal, light case cleanup',
        price: 'EUR 420',
        turnaround: '18 days',
        wouldReturn: true,
        watchAccepted: true,
      },
    ],
  },
  {
    id: 'watch-fixer',
    profileType: 'community',
    name: 'The Watch Fixer',
    city: 'Amsterdam',
    country: 'Netherlands',
    address: 'Ceintuurbaan 194, 1072 GC Amsterdam',
    type: 'Fast repair counter',
    distanceKm: 2.1,
    rating: 4.3,
    reviews: 9,
    description: 'Straightforward diagnostics for quartz watches, bracelets, batteries, and quick regulation jobs.',
    movements: ['Quartz', 'Seiko NH', 'Miyota'],
    price: 'EUR 80 - EUR 150',
    priceBucket: 'under150',
    turnaround: '1 - 2 weeks',
    turnaroundBucket: '1to4',
    x: 50,
    y: 70,
    reports: [
      {
        title: 'Tissot battery and reseal',
        watch: 'Tissot PR100',
        work: 'Battery, gasket, pressure test',
        price: 'EUR 48',
        turnaround: 'Same day',
        wouldReturn: true,
        watchAccepted: true,
      },
    ],
  },
  {
    id: 'craft-watch-studio',
    profileType: 'claimed',
    name: 'Craft Watch Studio',
    city: 'Amsterdam',
    country: 'Netherlands',
    address: 'Van Woustraat 51, 1074 AB Amsterdam',
    type: 'Custom and restoration studio',
    distanceKm: 3.5,
    rating: 4.9,
    reviews: 31,
    repFriendly: 'yes',
    description:
      'Collector-led studio for custom builds, careful polishing decisions, and detailed service photos after completion.',
    services: ['Mechanical service', 'Vintage restoration', 'Polishing', 'Regulation'],
    watchTypes: ['Seiko', 'Microbrands', 'Vintage'],
    movements: ['Seiko NH', 'Miyota', 'ETA', 'Sellita'],
    price: 'EUR 400 - EUR 800',
    priceBucket: 'over400',
    turnaround: '4 - 8 weeks',
    turnaroundBucket: 'over4',
    x: 36,
    y: 62,
    reports: [
      {
        title: 'Seiko 62MAS mod build',
        watch: 'Seiko NH35 custom',
        work: 'Assembly, regulation, bracelet sizing',
        price: 'EUR 160',
        turnaround: '9 days',
        wouldReturn: true,
        watchAccepted: true,
      },
    ],
  },
  {
    id: 'north-service-center',
    profileType: 'claimed',
    name: 'North Service Center',
    city: 'Amsterdam',
    country: 'Netherlands',
    address: 'Buikslotermeerplein 410, 1025 WP Amsterdam',
    type: 'Authorized service center',
    distanceKm: 4.4,
    rating: 4.6,
    reviews: 16,
    repFriendly: 'no',
    description:
      'Authorized channel for warranty-safe servicing, factory parts, water resistance testing, and documented estimates.',
    services: ['Mechanical service', 'Pressure testing', 'Water resistance'],
    watchTypes: ['Rolex', 'Omega', 'Tudor'],
    movements: ['Co-Axial', 'ETA', 'Sellita', 'Rolex 31xx'],
    price: 'EUR 450 - EUR 950',
    priceBucket: 'over400',
    turnaround: '6 - 10 weeks',
    turnaroundBucket: 'over4',
    x: 47,
    y: 18,
    reports: [
      {
        title: 'Tudor service estimate',
        watch: 'Tudor Black Bay 58',
        work: 'Estimate, gasket set, timing check',
        price: 'EUR 0 estimate',
        turnaround: '4 days',
        wouldReturn: true,
        watchAccepted: false,
      },
    ],
  },
]

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onChange}
      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-left text-sm text-slate-700 hover:bg-slate-100"
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded border ${
          checked ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white'
        }`}
      >
        {checked && <Check className="h-3 w-3" />}
      </span>
      <span>{label}</span>
    </button>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${index + 1 <= Math.round(rating) ? 'fill-current' : 'fill-none text-slate-300'}`}
        />
      ))}
    </span>
  )
}

function canShowReplicaPolicy(watchmaker: Watchmaker): watchmaker is ClaimedWatchmakerWithReplicaPolicy {
  return watchmaker.profileType === 'claimed' && watchmaker.repFriendly !== 'unknown'
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function priceBucketFromText(price: string): Watchmaker['priceBucket'] {
  const values = Array.from(price.matchAll(/\d+/g)).map((match) => Number(match[0])).filter(Number.isFinite)
  const average = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

  if (average > 400) return 'over400'
  if (average >= 150) return '150to400'
  return 'under150'
}

function turnaroundBucketFromText(turnaround: string): Watchmaker['turnaroundBucket'] {
  const lower = turnaround.toLowerCase()
  const values = Array.from(lower.matchAll(/\d+/g)).map((match) => Number(match[0])).filter(Number.isFinite)
  const maxValue = values.length > 0 ? Math.max(...values) : 0

  if (lower.includes('month') || (lower.includes('week') && maxValue > 4)) return 'over4'
  if (lower.includes('day') && maxValue <= 7) return 'under1'
  return '1to4'
}

function dbReportToServiceReport(report: DbServiceReportRow): ServiceReport {
  return {
    title: report.work_performed || 'Service report',
    watch: report.watch,
    work: report.work_performed,
    price: report.price ?? 'Price not shared',
    turnaround: report.turnaround ?? 'Timing not shared',
    wouldReturn: report.would_return ?? false,
    watchAccepted: report.watch_accepted ?? undefined,
  }
}

function mapDbWatchmaker(row: DbWatchmakerRow, reports: ServiceReport[]): Watchmaker {
  const fallbackPrice = reports.find((report) => report.price !== 'Price not shared')?.price ?? 'Reported prices vary'
  const fallbackTurnaround = reports.find((report) => report.turnaround !== 'Timing not shared')?.turnaround ?? 'Timing varies'
  const price = row.typical_price ?? fallbackPrice
  const turnaround = row.turnaround ?? fallbackTurnaround
  const base: WatchmakerBase = {
    id: row.id,
    slug: row.slug,
    ownerId: row.owner_id,
    profileType: row.profile_type,
    name: row.name,
    city: row.city,
    country: row.country,
    address: row.address ?? [row.city, row.country].filter(Boolean).join(', '),
    type: row.shop_type ?? (row.profile_type === 'claimed' ? 'Claimed watchmaker' : 'Community listing'),
    distanceKm: 0,
    rating: reports.length > 0 ? 4.5 : 0,
    reviews: reports.length,
    description: row.description ?? 'Community profile awaiting more service reports.',
    movements: row.movements ?? [],
    price,
    priceBucket: priceBucketFromText(price),
    turnaround,
    turnaroundBucket: turnaroundBucketFromText(turnaround),
    x: 50,
    y: 50,
    reports,
    website: row.website,
  }

  if (row.profile_type === 'claimed') {
    return {
      ...base,
      profileType: 'claimed',
      repFriendly: row.rep_friendly ?? 'unknown',
      services: row.services ?? [],
      watchTypes: row.watch_types ?? [],
    }
  }

  return {
    ...base,
    profileType: 'community',
  }
}

function RepLabel({ value }: { value: Exclude<ReplicaPolicy, 'unknown'> }) {
  if (value === 'yes') {
    return <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Rep friendly</span>
  }

  return <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Factory only</span>
}

function reportDerivedWatchTypes(reports: ServiceReport[]): string[] {
  return Array.from(
    new Set(
      reports.flatMap((report) => KNOWN_BRANDS.filter((brand) => report.watch.toLowerCase().includes(brand.toLowerCase()))),
    ),
  )
}

function displayWatchTypes(watchmaker: Watchmaker): string[] {
  if (watchmaker.profileType === 'claimed') {
    return watchmaker.watchTypes
  }

  return reportDerivedWatchTypes(watchmaker.reports)
}

function displayServices(watchmaker: Watchmaker): string[] {
  if (watchmaker.profileType === 'claimed') {
    return watchmaker.services
  }

  return Array.from(new Set(watchmaker.reports.map((report) => report.work.split(',')[0].trim()).filter(Boolean)))
}

function openStreetMapSearchUrl(watchmaker: Watchmaker): string {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(
    `${watchmaker.name}, ${watchmaker.address}, ${watchmaker.city}, ${watchmaker.country}`,
  )}`
}

function distanceKmBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radiusKm = 6371
  const toRadians = (value: number) => (value * Math.PI) / 180
  const deltaLat = toRadians(lat2 - lat1)
  const deltaLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)

  return 2 * radiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function compactService(service: string): string {
  return service
    .replace('Mechanical service', 'Mechanical')
    .replace('Battery service', 'Battery')
    .replace('Pressure testing', 'Pressure test')
}

function compactTurnaround(turnaround: string): string {
  return turnaround
    .replace(/\s*-\s*/g, '-')
    .replace(/\bweeks\b/g, 'wks')
    .replace(/\bweek\b/g, 'wk')
    .replace(/\bdays\b/g, 'days')
}

function compactPrice(price: string): string {
  return price.replace(/^EUR\s+(\d+)\s*-\s*EUR\s+(\d+)$/, '€$1-$2')
}

function trustSummary(watchmaker: Watchmaker): string {
  return `${watchmaker.reviews} reviews · ${watchmaker.reports.length} service reports`
}

function WatchmakerCard({
  watchmaker,
  active,
  onSelect,
}: {
  watchmaker: Watchmaker
  active: boolean
  onSelect: () => void
}) {
  const services = displayServices(watchmaker)
  const watchTypes = displayWatchTypes(watchmaker)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid w-full grid-cols-[112px_1fr] overflow-hidden rounded-lg border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200'
      }`}
    >
      <div className="relative min-h-[142px] bg-slate-100">
        <Image
          src="/images/watchmakers/watchmaker-bench.png"
          alt=""
          fill
          sizes="112px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/10" />
        {watchmaker.featured && (
          <span className="absolute left-2 top-2 rounded bg-blue-600 px-2 py-1 text-[10px] font-bold text-white">
            Featured
          </span>
        )}
      </div>
      <div className="min-w-0 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-950">
              {watchmaker.name} <BadgeCheck className="mb-0.5 inline h-3.5 w-3.5 text-blue-600" />
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span>{watchmaker.rating.toFixed(1)}</span>
              <Stars rating={watchmaker.rating} />
              <span>{trustSummary(watchmaker)}</span>
            </div>
          </div>
          <Bookmark className="h-4 w-4 shrink-0 text-slate-500" />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {canShowReplicaPolicy(watchmaker) && <RepLabel value={watchmaker.repFriendly} />}
          {watchTypes.slice(0, 2).map((type) => (
            <span key={type} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              {type}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs font-medium text-slate-700">
          {services[0] ? `${compactService(services[0])} · ` : ''}{compactTurnaround(watchmaker.turnaround)} · {compactPrice(watchmaker.price)}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {watchmaker.city} · {watchmaker.distanceKm} km away
        </p>
      </div>
    </button>
  )
}

function DetailPanel({
  watchmaker,
  onClose,
  onClaim,
  onManage,
  canManage,
}: {
  watchmaker: Watchmaker
  onClose?: () => void
  onClaim: (watchmaker: Watchmaker) => void
  onManage?: (watchmaker: ClaimedWatchmaker) => void
  canManage?: boolean
}) {
  const services = displayServices(watchmaker)
  const watchTypes = displayWatchTypes(watchmaker)
  const mapUrl = openStreetMapSearchUrl(watchmaker)

  return (
    <aside className="flex min-h-0 w-full flex-col overflow-hidden bg-white">
      <div className="relative h-44 shrink-0 bg-slate-100">
        <Image
          src="/images/watchmakers/watchmaker-bench.png"
          alt=""
          fill
          sizes="420px"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent" />
        {watchmaker.featured && (
          <span className="absolute left-4 top-4 rounded bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">
            Featured
          </span>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-md bg-white/90 p-2 text-slate-700 shadow-sm"
            aria-label="Close detail panel"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <h2 className="text-2xl font-extrabold text-slate-950">
          {watchmaker.name} <BadgeCheck className="mb-1 inline h-5 w-5 text-blue-600" />
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>{watchmaker.rating.toFixed(1)}</span>
          <Stars rating={watchmaker.rating} />
          <span>({watchmaker.reviews} reviews)</span>
        </div>
        <div className="mt-4 space-y-2 text-sm text-slate-700">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            {watchmaker.type}
          </p>
          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-md text-slate-700 transition hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <MapPin className="h-4 w-4 text-slate-500" />
            {watchmaker.distanceKm} km · {watchmaker.address}
          </a>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button asChild className="gap-2 bg-slate-950 hover:bg-slate-800">
            <a href={mapUrl} target="_blank" rel="noreferrer">
              <MapPin className="h-4 w-4" />
              Directions
            </a>
          </Button>
          <Button variant="outline" className="gap-2 bg-white">
            <Bookmark className="h-4 w-4" />
            Save
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => onClaim(watchmaker)}
          className="mt-2 w-full gap-2 bg-white"
        >
          <BadgeCheck className="h-4 w-4" />
          {watchmaker.profileType === 'claimed' ? 'Manage or verify claim' : 'Claim this business'}
        </Button>
        {canManage && watchmaker.profileType === 'claimed' && onManage && (
          <Button
            type="button"
            onClick={() => onManage(watchmaker)}
            className="mt-2 w-full gap-2 bg-slate-950 hover:bg-slate-800"
          >
            <Wrench className="h-4 w-4" />
            Edit owner profile
          </Button>
        )}

        <section className="mt-6 border-t border-slate-200 pt-5">
          <p className="text-sm leading-6 text-slate-700">{watchmaker.description}</p>
        </section>

        <section className="mt-5 grid gap-5 border-t border-slate-200 pt-5 xl:grid-cols-[1.1fr_0.9fr]">
          {services.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {watchmaker.profileType === 'claimed' ? 'Services' : 'Reported services'}
            </p>
            <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              {services.map((service) => (
                <span key={service} className="inline-flex items-center gap-2">
                  {service.includes('Pressure') || service.includes('Water') ? (
                    <Droplets className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Wrench className="h-4 w-4 text-slate-500" />
                  )}
                  {service}
                </span>
              ))}
            </div>
          </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Typical job</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {compactPrice(watchmaker.price)} · {compactTurnaround(watchmaker.turnaround)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Based on recent community reports</p>
          </div>

          {canShowReplicaPolicy(watchmaker) && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Replica policy</p>
              <RepLabel value={watchmaker.repFriendly} />
            </div>
          )}

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {watchmaker.profileType === 'claimed' ? 'Accepted watches' : 'Watches in reports'}
            </p>
            <div className="flex flex-wrap gap-2">
              {watchTypes.map((type) => (
                <span key={type} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {type}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 border-t border-slate-200 pt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Reports</p>
            <span className="text-xs font-medium text-blue-600">See all</span>
          </div>
          <div className="mt-3 space-y-3">
            {watchmaker.reports.map((report) => (
              <article key={report.title} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-950">{report.title}</h4>
                    <p className="mt-1 text-xs text-slate-600">{report.watch}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-950">{report.price}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{report.work}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{report.turnaround}</span>
                  <span className={report.wouldReturn ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-500'}>
                    Would return: {report.wouldReturn ? 'Yes' : 'No'}
                  </span>
                </div>
                {typeof report.watchAccepted === 'boolean' && (
                  <p className="mt-2 text-xs text-slate-500">
                    Personal account: watch accepted {report.watchAccepted ? 'yes' : 'no'}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </aside>
  )
}

function ClaimBusinessModal({
  watchmaker,
  userId,
  onClose,
}: {
  watchmaker: Watchmaker
  userId: string
  onClose: () => void
}) {
  const [role, setRole] = useState('')
  const [proof, setProof] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submitClaim = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setSubmitting(true)

    const { error } = await supabase.from('watchmaker_claim_requests').insert({
      watchmaker_id: isUuid(watchmaker.id) ? watchmaker.id : null,
      watchmaker_slug: watchmaker.id,
      watchmaker_name: watchmaker.name,
      claimant_id: userId,
      claimant_role: role.trim(),
      proof: proof.trim(),
    })

    setSubmitting(false)
    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Claim request submitted. We will review it before transferring profile controls.')
  }

  return (
    <section
      className="fixed inset-0 z-[75] overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-business-title"
      onClick={onClose}
    >
      <div className="mx-auto flex min-h-full w-full max-w-lg items-center">
        <form
          onSubmit={submitClaim}
          onClick={(event) => event.stopPropagation()}
          className="w-full rounded-lg border border-slate-200 bg-white p-5 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Business claim</p>
              <h2 id="claim-business-title" className="mt-2 text-xl font-extrabold text-slate-950">
                Claim {watchmaker.name}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Claims are tied to your Quiet Network account and reviewed before owner-only profile controls are unlocked.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close claim form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <label className="mt-5 block text-sm font-semibold text-slate-800">
            Your role
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              required
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-4 focus:ring-slate-900/10"
              placeholder="Owner, manager, watchmaker, authorized staff..."
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-slate-800">
            Verification note
            <textarea
              value={proof}
              onChange={(event) => setProof(event.target.value)}
              required
              rows={4}
              className="mt-1 w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-slate-900/10"
              placeholder="Use a business email, website contact page, public listing, or other proof we can verify."
            />
          </label>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={submitting} className="bg-slate-950 hover:bg-slate-800">
              {submitting ? 'Submitting...' : 'Submit claim'}
            </Button>
            <p className="text-xs text-slate-500">Signed in as a Quiet Network account.</p>
          </div>

          {message && (
            <p
              className={`mt-4 rounded-md border px-3 py-2 text-sm font-semibold ${
                message.startsWith('Claim request')
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
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

function OwnerProfileModal({
  watchmaker,
  onClose,
  onSaved,
}: {
  watchmaker: ClaimedWatchmaker
  onClose: () => void
  onSaved: (watchmaker: ClaimedWatchmaker) => void
}) {
  const [repFriendly, setRepFriendly] = useState<ReplicaPolicy>(watchmaker.repFriendly)
  const [watchTypes, setWatchTypes] = useState(watchmaker.watchTypes.join(', '))
  const [services, setServices] = useState(watchmaker.services.join(', '))
  const [price, setPrice] = useState(watchmaker.price)
  const [turnaround, setTurnaround] = useState(watchmaker.turnaround)
  const [website, setWebsite] = useState(watchmaker.website ?? '')
  const [description, setDescription] = useState(watchmaker.description)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const splitTags = (value: string) =>
    Array.from(new Set(value.split(',').map((item) => item.trim()).filter(Boolean)))

  const submitOwnerProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setSubmitting(true)

    const nextWatchTypes = splitTags(watchTypes)
    const nextServices = splitTags(services)
    const payload = {
      rep_friendly: repFriendly,
      watch_types: nextWatchTypes,
      services: nextServices,
      typical_price: price.trim() || null,
      turnaround: turnaround.trim() || null,
      website: website.trim() || null,
      description: description.trim() || null,
    }
    const query = supabase.from('watchmakers').update(payload)
    const { error } = isUuid(watchmaker.id)
      ? await query.eq('id', watchmaker.id)
      : await query.eq('slug', watchmaker.slug ?? watchmaker.id)

    setSubmitting(false)

    if (error) {
      setMessage(error.message)
      return
    }

    onSaved({
      ...watchmaker,
      repFriendly,
      watchTypes: nextWatchTypes,
      services: nextServices,
      price: price.trim() || watchmaker.price,
      priceBucket: priceBucketFromText(price.trim() || watchmaker.price),
      turnaround: turnaround.trim() || watchmaker.turnaround,
      turnaroundBucket: turnaroundBucketFromText(turnaround.trim() || watchmaker.turnaround),
      website: website.trim() || null,
      description: description.trim() || watchmaker.description,
    })
    setMessage('Owner profile saved.')
  }

  return (
    <section
      className="fixed inset-0 z-[75] overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-profile-title"
      onClick={onClose}
    >
      <div className="mx-auto flex min-h-full w-full max-w-2xl items-center">
        <form
          onSubmit={submitOwnerProfile}
          onClick={(event) => event.stopPropagation()}
          className="w-full rounded-lg border border-slate-200 bg-white p-5 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Owner profile</p>
              <h2 id="owner-profile-title" className="mt-2 text-xl font-extrabold text-slate-950">
                Edit {watchmaker.name}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                These shop-level tags are controlled by the claimed owner account.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close owner profile form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-800">
              Replica policy
              <select
                value={repFriendly}
                onChange={(event) => setRepFriendly(event.target.value as ReplicaPolicy)}
                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-4 focus:ring-slate-900/10"
              >
                <option value="unknown">Do not show a policy</option>
                <option value="yes">Rep friendly</option>
                <option value="no">Factory only</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-800">
              Website or contact
              <input
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-4 focus:ring-slate-900/10"
                placeholder="https://..."
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-semibold text-slate-800">
            Accepted brands
            <input
              value={watchTypes}
              onChange={(event) => setWatchTypes(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-4 focus:ring-slate-900/10"
              placeholder="Rolex, Omega, Seiko"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-slate-800">
            Service types
            <input
              value={services}
              onChange={(event) => setServices(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-4 focus:ring-slate-900/10"
              placeholder="Mechanical service, Regulation"
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-800">
              Typical price
              <input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-4 focus:ring-slate-900/10"
                placeholder="EUR 250 - EUR 450"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              Turnaround
              <input
                value={turnaround}
                onChange={(event) => setTurnaround(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-4 focus:ring-slate-900/10"
                placeholder="2 - 4 weeks"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-semibold text-slate-800">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="mt-1 w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-slate-900/10"
            />
          </label>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={submitting} className="bg-slate-950 hover:bg-slate-800">
              {submitting ? 'Saving...' : 'Save owner profile'}
            </Button>
            <p className="text-xs text-slate-500">Only the claimed owner account can save these fields.</p>
          </div>

          {message && (
            <p
              className={`mt-4 rounded-md border px-3 py-2 text-sm font-semibold ${
                message === 'Owner profile saved.'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
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

export function WatchmakersPageClient() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [contributionOpen, setContributionOpen] = useState(false)
  const [contributionType, setContributionType] = useState<ContributionType>('watchmaker')
  const [claimTarget, setClaimTarget] = useState<Watchmaker | null>(null)
  const [manageTarget, setManageTarget] = useState<ClaimedWatchmaker | null>(null)
  const [serviceFilters, setServiceFilters] = useState<string[]>([])
  const [watchTypeFilters, setWatchTypeFilters] = useState<string[]>([])
  const [countryFilter, setCountryFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [geoLookup, setGeoLookup] = useState<GeoLookup | null>(null)
  const [dbWatchmakers, setDbWatchmakers] = useState<Watchmaker[]>([])
  const [heroSearchOpen, setHeroSearchOpen] = useState(false)
  const [repOnly, setRepOnly] = useState(false)
  const [priceBucket, setPriceBucket] = useState<'all' | Watchmaker['priceBucket']>('all')
  const [turnaroundBucket, setTurnaroundBucket] = useState<'all' | Watchmaker['turnaroundBucket']>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 2000)

    fetch('http://ip-api.com/json/?fields=city,country,countryCode,lat,lon', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((result: GeoLookup | null) => {
        if (result?.countryCode) {
          setGeoLookup(result)
        }
      })
      .catch(() => undefined)
      .finally(() => window.clearTimeout(timeout))

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchApprovedWatchmakers() {
      const [{ data: shopRows, error: shopError }, { data: reportRows, error: reportError }] = await Promise.all([
        supabase.from('watchmakers').select('*').eq('approved', true).order('created_at', { ascending: false }),
        supabase.from('watchmaker_service_reports').select('*').eq('approved', true).order('created_at', { ascending: false }),
      ])

      if (cancelled || shopError || reportError) return

      const reportsByKey = new Map<string, ServiceReport[]>()
      ;((reportRows ?? []) as DbServiceReportRow[]).forEach((report) => {
        const keys = [report.watchmaker_id, report.watchmaker_slug, report.watchmaker_name].filter(Boolean) as string[]
        const serviceReport = dbReportToServiceReport(report)

        keys.forEach((key) => {
          const existing = reportsByKey.get(key) ?? []
          reportsByKey.set(key, [...existing, serviceReport])
        })
      })

      const mapped = ((shopRows ?? []) as DbWatchmakerRow[]).map((shop) => {
        const reports =
          reportsByKey.get(shop.id) ??
          (shop.slug ? reportsByKey.get(shop.slug) : undefined) ??
          reportsByKey.get(shop.name) ??
          []

        return mapDbWatchmaker(shop, reports)
      })

      setDbWatchmakers(mapped)
    }

    fetchApprovedWatchmakers().catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [])

  const watchmakers = useMemo(() => {
    const dbKeys = new Set(dbWatchmakers.flatMap((watchmaker) => [watchmaker.id, watchmaker.slug].filter(Boolean) as string[]))
    return [...dbWatchmakers, ...WATCHMAKERS.filter((watchmaker) => !dbKeys.has(watchmaker.id))]
  }, [dbWatchmakers])
  const countryFilters = useMemo(() => Array.from(new Set(watchmakers.map((watchmaker) => watchmaker.country))).sort(), [watchmakers])
  const cityFiltersByCountry = useMemo(
    () =>
      countryFilters.reduce<Record<string, string[]>>((filters, country) => {
        filters[country] = Array.from(
          new Set(watchmakers.filter((watchmaker) => watchmaker.country === country).map((watchmaker) => watchmaker.city)),
        ).sort()

        return filters
      }, {}),
    [countryFilters, watchmakers],
  )

  const filteredWatchmakers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return watchmakers.filter((watchmaker) => {
      const services = displayServices(watchmaker)
      const watchTypes = displayWatchTypes(watchmaker)
      const matchesQuery =
        !normalizedQuery ||
        [watchmaker.name, watchmaker.city, watchmaker.country, watchmaker.type, ...watchTypes, ...services]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      const matchesServices = serviceFilters.every((service) => services.includes(service))
      const matchesWatchTypes = watchTypeFilters.every((type) => watchTypes.includes(type))
      const matchesCountry = countryFilter === 'all' || watchmaker.country === countryFilter
      const matchesCity = cityFilter === 'all' || watchmaker.city === cityFilter
      const matchesRep = !repOnly || (canShowReplicaPolicy(watchmaker) && watchmaker.repFriendly === 'yes')
      const matchesPrice = priceBucket === 'all' || watchmaker.priceBucket === priceBucket
      const matchesTurnaround = turnaroundBucket === 'all' || watchmaker.turnaroundBucket === turnaroundBucket

      return (
        matchesQuery &&
        matchesCountry &&
        matchesCity &&
        matchesServices &&
        matchesWatchTypes &&
        matchesRep &&
        matchesPrice &&
        matchesTurnaround
      )
    })
  }, [cityFilter, countryFilter, priceBucket, query, repOnly, serviceFilters, turnaroundBucket, watchTypeFilters, watchmakers])

  const hasRefinementCriteria =
    query.trim().length > 0 ||
    serviceFilters.length > 0 ||
    watchTypeFilters.length > 0 ||
    repOnly ||
    priceBucket !== 'all' ||
    turnaroundBucket !== 'all'
  const hasLocationContext = countryFilter !== 'all' || cityFilter !== 'all'
  const shouldShowResults = hasLocationContext || hasRefinementCriteria
  const visibleWatchmakers = shouldShowResults ? filteredWatchmakers : []
  const locationLabel =
    cityFilter !== 'all' && countryFilter !== 'all'
      ? `${cityFilter}, ${countryFilter}`
      : cityFilter !== 'all'
        ? cityFilter
        : countryFilter !== 'all'
          ? countryFilter
          : ''
  const selectedWatchmaker =
    selectedId ? visibleWatchmakers.find((watchmaker) => watchmaker.id === selectedId) ?? null : null
  const resultHeading = !shouldShowResults
    ? 'Choose a location'
    : hasLocationContext
      ? hasRefinementCriteria
        ? `${visibleWatchmakers.length} matching watchmakers near ${locationLabel}`
        : `Trusted watchmakers near ${locationLabel}`
      : `${visibleWatchmakers.length} matching watchmakers`
  const resultSubheading = !shouldShowResults
    ? 'Search a city or use a nearby suggestion before comparing trusted profiles.'
    : hasLocationContext
      ? hasRefinementCriteria
        ? 'Matching your search and filters. Compare trust signals before distance.'
        : 'Start with community reports and known watch experience; distance is a tiebreaker.'
      : 'Matching your filters across all locations. Add a city later if distance matters.'

  const toggleFilter = (value: string, current: string[], setter: (next: string[]) => void) => {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value])
  }

  const resetFilters = () => {
    setQuery('')
    setCountryFilter('all')
    setCityFilter('all')
    setServiceFilters([])
    setWatchTypeFilters([])
    setRepOnly(false)
    setPriceBucket('all')
    setTurnaroundBucket('all')
    setSelectedId(null)
  }

  const openContribution = (type: ContributionType) => {
    setContributionType(type)
    setContributionOpen(true)
  }
  const openClaim = (watchmaker: Watchmaker) => {
    if (!user && !authLoading) {
      router.push(`/login?redirect=${encodeURIComponent(`/watchmakers?claim=${encodeURIComponent(watchmaker.id)}`)}`)
      return
    }

    if (user) {
      setClaimTarget(watchmaker)
    }
  }
  const canManageWatchmaker = (watchmaker: Watchmaker) =>
    Boolean(user && watchmaker.profileType === 'claimed' && watchmaker.ownerId === user.id)
  const saveManagedWatchmaker = (updated: ClaimedWatchmaker) => {
    setDbWatchmakers((current) => current.map((watchmaker) => (watchmaker.id === updated.id ? updated : watchmaker)))
    setManageTarget(updated)
  }

  useEffect(() => {
    if (!user) return

    const params = new URLSearchParams(window.location.search)
    const claimId = params.get('claim')
    if (!claimId) return

    const target = watchmakers.find((watchmaker) => watchmaker.id === claimId || watchmaker.slug === claimId)
    if (!target) return

    setClaimTarget(target)
    params.delete('claim')
    const nextSearch = params.toString()
    window.history.replaceState(null, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`)
  }, [user, watchmakers])
  const selectHeroCity = (suggestion: CitySuggestion) => {
    setQuery('')
    setCountryFilter(suggestion.country)
    setCityFilter(suggestion.city)
    setSelectedId(null)
    setHeroSearchOpen(false)
    window.setTimeout(() => document.getElementById('profiles')?.scrollIntoView({ behavior: 'smooth' }), 0)
  }
  const defaultCitySuggestions = useMemo(
    () =>
      Array.from(
        new Map(
          watchmakers.map((watchmaker) => [
            `${watchmaker.city}-${watchmaker.country}`,
            {
              city: watchmaker.city,
              country: watchmaker.country,
              countryCode: '',
              lat: 0,
              lon: 0,
            },
          ]),
        ).values(),
      ),
    [watchmakers],
  )
  const heroCitySuggestions = useMemo(() => {
    if (!geoLookup?.countryCode) return defaultCitySuggestions

    const countrySuggestions = MAJOR_CITY_SUGGESTIONS.filter((city) => city.countryCode === geoLookup.countryCode)
    const withCurrentCity =
      geoLookup.city && geoLookup.country
        ? [
            {
              city: geoLookup.city,
              country: geoLookup.country,
              countryCode: geoLookup.countryCode,
              lat: geoLookup.lat ?? 0,
              lon: geoLookup.lon ?? 0,
            },
            ...countrySuggestions,
          ]
        : countrySuggestions
    const uniqueSuggestions = Array.from(
      new Map(withCurrentCity.map((city) => [`${city.city}-${city.country}`, city])).values(),
    )

    if (typeof geoLookup.lat !== 'number' || typeof geoLookup.lon !== 'number') {
      return uniqueSuggestions.length > 0 ? uniqueSuggestions : defaultCitySuggestions
    }

    return uniqueSuggestions.length > 0
      ? uniqueSuggestions
          .slice()
          .sort((a, b) => distanceKmBetween(geoLookup.lat!, geoLookup.lon!, a.lat, a.lon) - distanceKmBetween(geoLookup.lat!, geoLookup.lon!, b.lat, b.lon))
      : defaultCitySuggestions
  }, [defaultCitySuggestions, geoLookup])
  const visibleHeroCitySuggestions = heroCitySuggestions.filter((suggestion) => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return true

    return `${suggestion.city} ${suggestion.country}`.toLowerCase().includes(normalizedQuery)
  })
  const featuredProfiles = watchmakers.slice().sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.rating - a.rating).slice(0, 3)
  const reportCount = watchmakers.reduce((count, watchmaker) => count + watchmaker.reports.length, 0)
  const repFriendlyCount = watchmakers.filter(
    (watchmaker) => canShowReplicaPolicy(watchmaker) && watchmaker.repFriendly === 'yes',
  ).length
  const cityShopCount = (city: string, country: string) =>
    watchmakers.filter((watchmaker) => watchmaker.city === city && watchmaker.country === country).length
  const availableCityFilters =
    countryFilter === 'all'
      ? Array.from(new Set(watchmakers.map((watchmaker) => watchmaker.city))).sort()
      : cityFiltersByCountry[countryFilter] ?? []

  const filterPanel = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-950">Filters</h2>
        <button type="button" onClick={resetFilters} className="text-xs font-semibold text-slate-500 hover:text-slate-950">
          Reset
        </button>
      </div>

      <section>
        <h3 className="text-sm font-bold text-slate-950">Location</h3>
        <div className="mt-2 grid gap-2">
          <label className="text-xs font-semibold text-slate-600">
            Country
            <span className="mt-1 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
              <Crosshair className="h-4 w-4 text-slate-500" />
              <select
                value={countryFilter}
                onChange={(event) => {
                  const nextCountry = event.target.value
                  setCountryFilter(nextCountry)
                  setCityFilter('all')
                }}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              >
                <option value="all">All countries</option>
                {countryFilters.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <label className="text-xs font-semibold text-slate-600">
            City
            <span className="mt-1 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
              <MapPin className="h-4 w-4 text-slate-500" />
              <select
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              >
                <option value="all">All cities</option>
                {availableCityFilters.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </span>
          </label>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-4">
        <h3 className="text-sm font-bold text-slate-950">Services</h3>
        <div className="mt-2 space-y-1">
          {SERVICE_FILTERS.map((service) => (
            <FilterCheckbox
              key={service}
              label={service}
              checked={serviceFilters.includes(service)}
              onChange={() => toggleFilter(service, serviceFilters, setServiceFilters)}
            />
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 pt-4">
        <h3 className="text-sm font-bold text-slate-950">Watch Types</h3>
        <div className="mt-2 space-y-1">
          {WATCH_TYPE_FILTERS.map((type) => (
            <FilterCheckbox
              key={type}
              label={type}
              checked={watchTypeFilters.includes(type)}
              onChange={() => toggleFilter(type, watchTypeFilters, setWatchTypeFilters)}
            />
          ))}
          <FilterCheckbox label="Replica-friendly only" checked={repOnly} onChange={() => setRepOnly(!repOnly)} />
        </div>
      </section>

      <section className="border-t border-slate-200 pt-4">
        <h3 className="text-sm font-bold text-slate-950">Turnaround</h3>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            ['under1', 'Under 1 week'],
            ['1to4', '1-4 weeks'],
            ['over4', 'Over 4 weeks'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={turnaroundBucket === value}
              onClick={() => setTurnaroundBucket(turnaroundBucket === value ? 'all' : (value as Watchmaker['turnaroundBucket']))}
              className={`rounded-md border px-2 py-2 text-xs font-semibold ${
                turnaroundBucket === value ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 pt-4">
        <h3 className="text-sm font-bold text-slate-950">Typical Price</h3>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            ['under150', 'Under EUR 150'],
            ['150to400', 'EUR 150-400'],
            ['over400', 'Over EUR 400'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={priceBucket === value}
              onClick={() => setPriceBucket(priceBucket === value ? 'all' : (value as Watchmaker['priceBucket']))}
              className={`rounded-md border px-2 py-2 text-xs font-semibold ${
                priceBucket === value ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  )

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
          <Link href="/watchmakers" className="flex items-center gap-2 text-slate-950">
            <span className="relative flex h-10 w-8 items-center justify-center bg-white">
              <Image
                src="/images/watchmakers/watchmap-logo.png"
                alt=""
                fill
                sizes="32px"
                className="object-contain"
              />
            </span>
            <span className="text-lg font-extrabold">Watchmakers</span>
            <span className="hidden rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500 sm:inline">
              by Quiet Network
            </span>
          </Link>

          <div className="relative ml-auto hidden w-full max-w-md md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by city, shop name, brand, or service..."
              className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none ring-slate-900/10 transition focus:ring-4"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            className="hidden bg-white md:inline-flex"
            onClick={() => openContribution('watchmaker')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add watchmaker
          </Button>
          <Button
            type="button"
            className="hidden bg-slate-950 hover:bg-slate-800 md:inline-flex"
            onClick={() => openContribution('report')}
          >
            <MessageSquareText className="mr-2 h-4 w-4" />
            Service report
          </Button>
          <Button
            type="button"
            variant="outline"
            className="hidden bg-white md:inline-flex"
            onClick={() => router.push(user ? '/profile' : `/login?redirect=${encodeURIComponent('/watchmakers')}`)}
          >
            {user ? 'Account' : 'Sign in'}
          </Button>
          <button type="button" className="rounded-md p-2 text-slate-700 md:hidden" aria-label="Menu">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center lg:px-6 lg:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Watchmakers by Quiet Network</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl">
            Find a watchmaker you can trust.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
            Community service reports, accepted brands, price ranges, and turnaround from people who have actually been there.
          </p>

          <div className="mx-auto mt-7 w-full max-w-[560px] text-left">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setHeroSearchOpen(true)}
                onBlur={() => window.setTimeout(() => setHeroSearchOpen(false), 120)}
                placeholder="City, shop name, or brand..."
                className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 shadow-sm outline-none ring-slate-900/10 transition focus:ring-4"
              />
            </div>

            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => {
                  if (geoLookup?.city && geoLookup.country) {
                    selectHeroCity({
                      city: geoLookup.city,
                      country: geoLookup.country,
                      countryCode: geoLookup.countryCode ?? '',
                      lat: geoLookup.lat ?? 0,
                      lon: geoLookup.lon ?? 0,
                    })
                  } else {
                    setHeroSearchOpen(true)
                  }
                }}
                className="flex w-full items-center gap-3 border-b border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Crosshair className="h-4 w-4" />
                </span>
                Use my location
              </button>
              <div className="px-4 py-3">
                <p className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Nearby cities</p>
                <div className="mt-2 space-y-1">
                  {(heroSearchOpen ? visibleHeroCitySuggestions : heroCitySuggestions).slice(0, 5).map((suggestion) => {
                    const shopCount = cityShopCount(suggestion.city, suggestion.country)

                    return (
                      <button
                        key={`${suggestion.city}-${suggestion.country}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectHeroCity(suggestion)}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <MapPin className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold text-slate-950">{suggestion.city}</span>
                          <span className="block truncate text-xs text-slate-500">{suggestion.country}</span>
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {shopCount > 0 ? `${shopCount} ${shopCount === 1 ? 'shop' : 'shops'}` : 'Major city'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/70">
          <div className="mx-auto grid max-w-xl grid-cols-3 gap-4 px-4 py-6 text-center">
            <div>
              <p className="text-2xl font-extrabold text-slate-950">{watchmakers.length}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Watchmakers listed</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-950">{reportCount}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Service reports</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-950">{repFriendlyCount}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Rep-friendly confirmed</p>
            </div>
          </div>
        </div>

        {false && (
        <div className="border-t border-slate-200 bg-white px-4 py-9 lg:px-6">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Featured profiles</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {featuredProfiles.map((watchmaker) => (
                <button
                  key={watchmaker.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(watchmaker.id)
                    document.getElementById('profiles')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-extrabold text-slate-950">{watchmaker.name}</h3>
                    <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-600">
                    <Stars rating={watchmaker.rating} />
                    <span>{watchmaker.rating.toFixed(1)}</span>
                  </div>
                  <div className="mt-3 h-6">
                    {canShowReplicaPolicy(watchmaker) && watchmaker.repFriendly === 'yes' && <RepLabel value={watchmaker.repFriendly} />}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    {watchmaker.city} · {compactPrice(watchmaker.price)} · {compactTurnaround(watchmaker.turnaround)}
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="bg-white"
                onClick={() => openContribution('report')}
              >
                <MessageSquareText className="mr-2 h-4 w-4" />
                Submit a service report
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-white"
                onClick={() => openContribution('watchmaker')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add a watchmaker
              </Button>
              <Button asChild variant="outline" className="bg-white">
                <a href="#profiles">
                  <Search className="mr-2 h-4 w-4" />
                  Browse all
                </a>
              </Button>
            </div>
          </div>
        </div>
        )}
      </section>

      <section id="profiles" className="grid min-h-[calc(100vh-64px)] border-b border-slate-200 lg:grid-cols-[minmax(420px,520px)_minmax(420px,1fr)]">
        <section className="border-r border-slate-200 bg-slate-50">
          <div className="sticky top-16 z-20 border-b border-slate-200 bg-white p-4">
            <div className="relative md:hidden">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search watchmakers..."
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none"
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 md:mt-0">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">{resultHeading}</h2>
                <p className="text-xs text-slate-500">{resultSubheading}</p>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
              >
                <ListFilter className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>
          <div className="space-y-3 p-4">
            {!shouldShowResults ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
                <MapPin className="mx-auto h-7 w-7 text-slate-400" />
                <h3 className="mt-3 font-bold text-slate-950">Pick a city first</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-600">
                  Trusted watchmaker results appear after you choose a location, so the list starts local instead of global.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {heroCitySuggestions.slice(0, 4).map((suggestion) => (
                    <button
                      key={`${suggestion.city}-${suggestion.country}-empty`}
                      type="button"
                      onClick={() => selectHeroCity(suggestion)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 transition hover:border-slate-300 hover:bg-white"
                    >
                      {suggestion.city}
                    </button>
                  ))}
                </div>
              </div>
            ) : visibleWatchmakers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-slate-400" />
                <h3 className="mt-3 font-bold text-slate-950">No exact match yet</h3>
                <p className="mt-1 text-sm text-slate-600">Reset filters or add the watchmaker you expected to find.</p>
              </div>
            ) : (
              visibleWatchmakers.map((watchmaker) => (
                <WatchmakerCard
                  key={watchmaker.id}
                  watchmaker={watchmaker}
                  active={selectedId === watchmaker.id}
                  onSelect={() => setSelectedId(watchmaker.id)}
                />
              ))
            )}
          </div>
        </section>

        <div className="hidden min-h-0 border-l border-slate-200 bg-slate-100/60 p-5 lg:flex lg:justify-center">
          {selectedWatchmaker ? (
            <div className="flex min-h-0 w-full max-w-[640px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <DetailPanel
                watchmaker={selectedWatchmaker}
                onClaim={openClaim}
                onManage={setManageTarget}
                canManage={canManageWatchmaker(selectedWatchmaker)}
              />
            </div>
          ) : !shouldShowResults ? (
            <aside className="flex h-full min-h-[520px] w-full max-w-[640px] items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="max-w-sm">
                <p className="text-sm font-semibold text-slate-950">Choose a location</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Pick a city to load trusted local watchmakers, then select a profile to compare details.
                </p>
              </div>
            </aside>
          ) : (
            <aside className="flex h-full min-h-[520px] w-full max-w-[640px] items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="max-w-sm">
                <p className="text-sm font-semibold text-slate-950">Select a watchmaker</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Keep the list in view while you compare trust signals, services, reports, and distance.
                </p>
              </div>
            </aside>
          )}
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-4 py-9 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Featured profiles</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {featuredProfiles.map((watchmaker) => (
              <button
                key={watchmaker.id}
                type="button"
                onClick={() => {
                  setCountryFilter(watchmaker.country)
                  setCityFilter(watchmaker.city)
                  setSelectedId(watchmaker.id)
                  document.getElementById('profiles')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-extrabold text-slate-950">{watchmaker.name}</h3>
                  <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-600">
                  <Stars rating={watchmaker.rating} />
                  <span>{watchmaker.rating.toFixed(1)}</span>
                </div>
                <div className="mt-3 h-6">
                  {canShowReplicaPolicy(watchmaker) && watchmaker.repFriendly === 'yes' && <RepLabel value={watchmaker.repFriendly} />}
                </div>
                <p className="hidden mt-2 text-sm font-semibold text-slate-600">
                  {watchmaker.city} Â· {compactPrice(watchmaker.price)} Â· {compactTurnaround(watchmaker.turnaround)}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {watchmaker.city} - {compactPrice(watchmaker.price)} - {compactTurnaround(watchmaker.turnaround)}
                </p>
              </button>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="bg-white"
              onClick={() => openContribution('report')}
            >
              <MessageSquareText className="mr-2 h-4 w-4" />
              Submit a service report
            </Button>
            <Button
              type="button"
              variant="outline"
              className="bg-white"
              onClick={() => openContribution('watchmaker')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add a watchmaker
            </Button>
            <Button asChild variant="outline" className="bg-white">
              <a href="#profiles">
                <Search className="mr-2 h-4 w-4" />
                Search location
              </a>
            </Button>
          </div>
        </div>
      </section>

      {selectedWatchmaker && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden">
          <div className="ml-auto h-full w-full max-w-md overflow-y-auto bg-white shadow-xl">
            <DetailPanel
              watchmaker={selectedWatchmaker}
              onClose={() => setSelectedId(null)}
              onClaim={openClaim}
              onManage={setManageTarget}
              canManage={canManageWatchmaker(selectedWatchmaker)}
            />
          </div>
        </div>
      )}

      {claimTarget && user && (
        <ClaimBusinessModal watchmaker={claimTarget} userId={user.id} onClose={() => setClaimTarget(null)} />
      )}

      {manageTarget && user && (
        <OwnerProfileModal
          watchmaker={manageTarget}
          onClose={() => setManageTarget(null)}
          onSaved={saveManagedWatchmaker}
        />
      )}

      <WatchmakerContributionModule
        open={contributionOpen}
        initialType={contributionType}
        onClose={() => setContributionOpen(false)}
        shops={watchmakers.map((watchmaker) => ({
          id: watchmaker.id,
          name: watchmaker.name,
          city: watchmaker.city,
          address: watchmaker.address,
        }))}
      />

      {filtersOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40">
          <div className="h-full w-full max-w-sm overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-950">Filters</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} className="rounded-md p-2 text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {filterPanel}
            <Button onClick={() => setFiltersOpen(false)} className="mt-6 w-full bg-slate-950 hover:bg-slate-800">
              Show results
            </Button>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 bg-slate-950 px-4 py-8 text-white lg:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-extrabold">Watchmakers by Quiet Network</p>
            <p className="mt-1 text-sm text-slate-300">The easiest way to find trusted watchmakers.</p>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white">
            Quiet Network
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </Link>
        </div>
      </footer>
    </main>
  )
}
