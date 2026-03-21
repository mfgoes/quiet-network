'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AboutPage } from '@/components/AboutPage'
import { Shell } from '@/components/Shell'
import { Button } from '@/components/ui/button'

export default function About() {
  const router = useRouter()
  return (
    <Shell
      wide
      leading={
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      }
    >
      <AboutPage onJoin={() => router.push('/login')} />
    </Shell>
  )
}
