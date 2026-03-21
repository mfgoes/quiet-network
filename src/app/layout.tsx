import type { Metadata } from 'next'
import { Urbanist } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const urbanist = Urbanist({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-urbanist',
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
    <html lang="en" className={urbanist.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
