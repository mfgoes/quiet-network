import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase-server'
import { UserProfilePageClient } from '@/components/UserProfilePageClient'

export const revalidate = 60

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const supabase = createServerSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('username', username)
    .single()

  if (!profile) return { title: 'User not found' }

  return {
    title: `${profile.display_name} (@${profile.username}) — Quiet Network`,
    description: `${profile.display_name}'s profile on Quiet Network`,
  }
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params
  return <UserProfilePageClient username={username} />
}
