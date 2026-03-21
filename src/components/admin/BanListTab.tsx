'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { avatarUrl } from "@/types"
import type { BannedUser } from "@/types"

interface BanListTabProps {
  bannedUsers: BannedUser[]
  onUnban: (banId: string) => Promise<unknown>
}

export function BanListTab({ bannedUsers, onUnban }: BanListTabProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleUnban = async (banId: string) => {
    setLoadingId(banId)
    await onUnban(banId)
    setLoadingId(null)
  }

  if (bannedUsers.length === 0) {
    return <p className="text-sm text-quiet-muted py-4 text-center">No banned users.</p>
  }

  return (
    <div className="space-y-1">
      {bannedUsers.map((ban) => (
        <div
          key={ban.id}
          className="flex items-center justify-between rounded-lg border border-quiet-border bg-white px-4 py-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={avatarUrl(ban.profile?.avatar_emoji ?? "house")}
              alt="avatar"
              className="h-8 w-8 rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <span className="text-sm font-medium text-quiet-slate truncate block">
                {ban.profile?.display_name ?? "Unknown"}
              </span>
              <p className="text-xs text-quiet-muted">
                @{ban.profile?.username ?? "?"} &middot; Banned{" "}
                {new Date(ban.created_at).toLocaleDateString()}
                {ban.reason && <> &middot; {ban.reason}</>}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled={loadingId === ban.id}
            onClick={() => handleUnban(ban.id)}
          >
            Unban
          </Button>
        </div>
      ))}
    </div>
  )
}
