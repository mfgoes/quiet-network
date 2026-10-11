import type { Metadata } from 'next'
import { Newsreader, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

// Display: an editorial serif, like a good local paper
const newsreader = Newsreader({
	subsets: ['latin'],
	style: ['normal', 'italic'],
	axes: ['opsz'],
	variable: '--font-newsreader',
	display: 'swap',
})

// Labels: time, tags, roles. Mono labels things, it never says things.
const plexMono = IBM_Plex_Mono({
	subsets: ['latin'],
	weight: ['400', '500'],
	variable: '--font-plex-mono',
	display: 'swap',
})

export const metadata: Metadata = {
  title: 'Quiet Network — Your neighborhood, without the noise',
  description: 'A calm, local community for your neighborhood. Share updates, ask for help, and stay connected — without the noise.',
  openGraph: {
    type: 'website',
    siteName: 'Quiet Network',
    title: 'Quiet Network',
    description: 'Your neighborhood, without the noise.',
    images: [{ url: 'https://quiet-network.vercel.app/images/landscape_with_boats.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quiet Network',
    description: 'Your neighborhood, without the noise.',
    images: ['https://quiet-network.vercel.app/images/landscape_with_boats.jpg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${plexMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
