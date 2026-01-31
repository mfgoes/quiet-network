import { useState } from "react"
import { MoreHorizontal, Shield, ShieldCheck, UserMinus, Ban } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { avatarUrl } from "@/types"
import type { AdminCircleMember, CircleRole } from "@/types"

interface MembersTabProps {
  members: AdminCircleMember[]
  currentUserId: string
  currentUserRole: CircleRole
  onUpdateRole: (userId: string, role: CircleRole) => Promise<unknown>
  onRemoveMember: (userId: string) => Promise<unknown>
  onBanUser: (userId: string, reason: string) => Promise<unknown>
}

export function MembersTab({
  members,
  currentUserId,
  currentUserRole,
  onUpdateRole,
  onRemoveMember,
  onBanUser,
}: MembersTabProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleAction = async (fn: () => Promise<unknown>, userId: string) => {
    setLoadingId(userId)
    await fn()
    setLoadingId(null)
  }

  const canManage = (target: AdminCircleMember) => {
    if (target.user_id === currentUserId) return false
    if (currentUserRole === "admin") return true
    if (currentUserRole === "moderator" && target.role === "member") return true
    return false
  }

  return (
    <div className="space-y-1">
      {members.length === 0 && (
        <p className="text-sm text-quiet-muted py-4 text-center">No members found.</p>
      )}
      {members.map((member) => (
        <div
          key={member.user_id}
          className="flex items-center justify-between rounded-lg border border-quiet-border bg-white px-4 py-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={avatarUrl(member.avatar_emoji)}
              alt="avatar"
              className="h-8 w-8 rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-quiet-slate truncate">
                  {member.display_name}
                </span>
                <Badge variant={member.role}>{member.role}</Badge>
              </div>
              <p className="text-xs text-quiet-muted">
                @{member.username} &middot; {member.post_count} posts &middot; {member.upvote_count} upvotes
              </p>
            </div>
          </div>

          {canManage(member) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded p-1.5 text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate transition-colors"
                  disabled={loadingId === member.user_id}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currentUserRole === "admin" && member.role !== "moderator" && (
                  <DropdownMenuItem
                    onClick={() =>
                      handleAction(() => onUpdateRole(member.user_id, "moderator"), member.user_id)
                    }
                  >
                    <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                    Make moderator
                  </DropdownMenuItem>
                )}
                {currentUserRole === "admin" && member.role !== "admin" && (
                  <DropdownMenuItem
                    onClick={() =>
                      handleAction(() => onUpdateRole(member.user_id, "admin"), member.user_id)
                    }
                  >
                    <Shield className="mr-2 h-3.5 w-3.5" />
                    Make admin
                  </DropdownMenuItem>
                )}
                {currentUserRole === "admin" && member.role !== "member" && (
                  <DropdownMenuItem
                    onClick={() =>
                      handleAction(() => onUpdateRole(member.user_id, "member"), member.user_id)
                    }
                  >
                    <UserMinus className="mr-2 h-3.5 w-3.5" />
                    Demote to member
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  destructive
                  onClick={() =>
                    handleAction(() => onRemoveMember(member.user_id), member.user_id)
                  }
                >
                  <UserMinus className="mr-2 h-3.5 w-3.5" />
                  Remove from circle
                </DropdownMenuItem>
                <DropdownMenuItem
                  destructive
                  onClick={() =>
                    handleAction(() => onBanUser(member.user_id, "Banned by admin"), member.user_id)
                  }
                >
                  <Ban className="mr-2 h-3.5 w-3.5" />
                  Ban user
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  )
}
