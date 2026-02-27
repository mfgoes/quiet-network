import { useState, useMemo, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Shield, Users, FileWarning, Ban, Settings, ArrowLeft, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CircleIcon } from "@/components/CircleIcon"
import { MembersTab } from "@/components/admin/MembersTab"
import { ReportsTab } from "@/components/admin/ReportsTab"
import { BanListTab } from "@/components/admin/BanListTab"
import { SettingsTab } from "@/components/admin/SettingsTab"
import {
  useCircleBySlug,
  useAdminMembers,
  useAdminReports,
  useBannedUsers,
  useAdminStats,
  useAdminCircleMemberCounts,
} from "@/lib/hooks"
import type { Circle, CircleRole } from "@/types"

interface AdminPanelProps {
  userId: string
  adminCircles: (Circle & { role: CircleRole })[]
  updateCircle: (
    circleId: string,
    updates: { name?: string; slug?: string; description?: string | null; about?: string | null; rules?: string | null; country?: string | null; links?: { label: string; url: string }[] | null; banner_color?: string | null; avatar_url?: string | null }
  ) => Promise<{ data: Circle | null; error: unknown }>
  uploadCircleAvatar: (circleId: string, file: File) => Promise<{ url: string | null; error: unknown }>
  deleteCircle: (circleId: string) => Promise<unknown>
}

export function AdminPanel({ userId, adminCircles, updateCircle, uploadCircleAvatar, deleteCircle }: AdminPanelProps) {
  const { circleSlug } = useParams<{ circleSlug: string }>()
  const { circle, loading: circleLoading, refetch: refetchCircle } = useCircleBySlug(circleSlug)
  const navigate = useNavigate()

  // Find user's role for this circle
  const adminEntry = useMemo(
    () => adminCircles.find((c) => c.slug === circleSlug),
    [adminCircles, circleSlug]
  )
  const userRole = adminEntry?.role ?? "member"

  const circleId = circle?.id
  const { members, loading: membersLoading, updateRole, removeMember } = useAdminMembers(circleId)
  const { reports, loading: reportsLoading, updateReport } = useAdminReports(circleId)
  const { bannedUsers, loading: bannedLoading, banUser, unbanUser } = useBannedUsers(circleId)
  const { stats } = useAdminStats(circleId)

  // Member counts for the circle selector dropdown
  const adminCircleIds = useMemo(() => adminCircles.map((c) => c.id), [adminCircles])
  const { memberCounts } = useAdminCircleMemberCounts(adminCircleIds)

  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    const handleClick = () => setDropdownOpen(false)
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [dropdownOpen])

  if (circleLoading) {
    return <p className="text-center text-sm text-quiet-muted">Loading...</p>
  }

  if (!circle || !adminEntry) {
    return (
      <div>
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="mt-4 text-center text-sm text-quiet-muted">
          You don't have admin access to this circle.
        </p>
      </div>
    )
  }

  const handleBanUser = async (targetUserId: string, reason: string) => {
    await banUser(targetUserId, userId, reason)
    removeMember(targetUserId)
  }

  return (
    <div>
      {/* Header row: back + title on left, circle selector on right */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/${circle.slug}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Shield className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg font-semibold text-quiet-slate">Admin Panel</h1>
        </div>

        {/* Circle selector dropdown (right-aligned) */}
        {adminCircles.length > 0 && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDropdownOpen(!dropdownOpen)
              }}
              className="flex items-center gap-2 rounded-lg border border-quiet-border bg-white px-3 py-2 text-sm text-quiet-slate hover:bg-quiet-aged transition-colors"
            >
              <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="sm" />
              <span className="max-w-[120px] truncate">{circle.name}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-quiet-muted transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[220px] rounded-lg border border-quiet-border bg-white py-1 shadow-lg">
                {adminCircles.map((ac) => {
                  const isSelected = ac.slug === circleSlug
                  const count = memberCounts[ac.id] ?? 0
                  return (
                    <button
                      key={ac.id}
                      onClick={() => {
                        navigate(`/admin/${ac.slug}`)
                        setDropdownOpen(false)
                      }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-quiet-slate hover:bg-quiet-aged"
                      }`}
                    >
                      <CircleIcon name={ac.name} avatarUrl={ac.avatar_url} size="sm" />
                      <span className="flex-1 truncate text-left">{ac.name}</span>
                      <span className="flex items-center gap-1 text-xs text-quiet-muted">
                        <Users className="h-3 w-3" />
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Circle info */}
      <div className="flex items-center gap-3 mb-6">
        <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="lg" />
        <div>
          <h2 className="text-base font-medium text-quiet-slate">{circle.name}</h2>
          <Badge variant={userRole}>{userRole}</Badge>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        <StatCard icon={Users} label="Members" value={stats.members} />
        <StatCard icon={FileWarning} label="Posts (7d)" value={stats.recentPosts} />
        <StatCard icon={Shield} label="Pending" value={stats.pendingReports} highlight={stats.pendingReports > 0} />
        <StatCard icon={Ban} label="Banned" value={stats.banned} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Members
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileWarning className="mr-1.5 h-3.5 w-3.5" />
            Reports
            {stats.pendingReports > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-medium text-amber-800">
                {stats.pendingReports}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="bans">
            <Ban className="mr-1.5 h-3.5 w-3.5" />
            Ban List
          </TabsTrigger>
          {userRole === "admin" && (
            <TabsTrigger value="settings">
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members">
          {membersLoading ? (
            <p className="text-sm text-quiet-muted py-4 text-center">Loading members...</p>
          ) : (
            <MembersTab
              members={members}
              currentUserId={userId}
              currentUserRole={userRole}
              onUpdateRole={updateRole}
              onRemoveMember={removeMember}
              onBanUser={handleBanUser}
            />
          )}
        </TabsContent>

        <TabsContent value="reports">
          {reportsLoading ? (
            <p className="text-sm text-quiet-muted py-4 text-center">Loading reports...</p>
          ) : (
            <ReportsTab
              reports={reports}
              currentUserId={userId}
              onUpdateReport={updateReport}
            />
          )}
        </TabsContent>

        <TabsContent value="bans">
          {bannedLoading ? (
            <p className="text-sm text-quiet-muted py-4 text-center">Loading ban list...</p>
          ) : (
            <BanListTab bannedUsers={bannedUsers} onUnban={unbanUser} />
          )}
        </TabsContent>

        {userRole === "admin" && (
          <TabsContent value="settings">
            <SettingsTab
              circle={circle}
              onSave={async (updates) => {
                const { error, data } = await updateCircle(circle.id, updates)
                await refetchCircle()
                if (!error && data?.slug && data.slug !== circle.slug) {
                  navigate(`/admin/${data.slug}`)
                }
                return { error }
              }}
              onUploadAvatar={async (file) => {
                const result = await uploadCircleAvatar(circle.id, file)
                if (!result.error) await refetchCircle()
                return result
              }}
              onDelete={async () => {
                await deleteCircle(circle.id)
                navigate("/")
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-amber-200 bg-amber-50" : "border-quiet-border bg-white"}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${highlight ? "text-amber-600" : "text-quiet-muted"}`} />
        <span className="text-xs text-quiet-muted">{label}</span>
      </div>
      <p className={`text-xl font-semibold ${highlight ? "text-amber-800" : "text-quiet-slate"}`}>
        {value}
      </p>
    </div>
  )
}
