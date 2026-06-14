import type { Metadata } from 'next'
import { WatchmakersPageClient } from '@/components/WatchmakersPageClient'

export const metadata: Metadata = {
  title: 'Watchmakers by Quiet Network',
  description:
    'Find trusted watchmakers near you with community reviews, service reports, and recommendations from fellow enthusiasts.',
  openGraph: {
    title: 'Watchmakers by Quiet Network',
    description: 'Find trusted watchmakers near you.',
    images: [{ url: 'https://quiet-network.vercel.app/images/watchmakers/watchmaker-bench.png' }],
  },
}

export default function WatchmakersPage() {
  return <WatchmakersPageClient />
}
