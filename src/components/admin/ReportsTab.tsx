'use client'

import { useState } from "react"
import { CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { avatarUrl } from "@/types"
import type { Report } from "@/types"

interface ReportsTabProps {
  reports: Report[]
  currentUserId: string
  onUpdateReport: (reportId: string, status: "reviewed" | "dismissed", reviewedBy: string) => Promise<unknown>
}

export function ReportsTab({ reports, currentUserId, onUpdateReport }: ReportsTabProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleAction = async (reportId: string, status: "reviewed" | "dismissed") => {
    setLoadingId(reportId)
    await onUpdateReport(reportId, status, currentUserId)
    setLoadingId(null)
  }

  if (reports.length === 0) {
    return <p className="text-sm text-quiet-muted py-4 text-center">No reports.</p>
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div
          key={report.id}
          className="rounded-lg border border-quiet-border bg-white p-4"
        >
          {/* Status badge */}
          <div className="flex items-center justify-between mb-2">
            <Badge
              variant={
                report.status === "pending"
                  ? "expiring"
                  : report.status === "reviewed"
                  ? "pinned"
                  : "default"
              }
            >
              {report.status}
            </Badge>
            <span className="text-xs text-quiet-muted">
              {new Date(report.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* Reported post preview */}
          {report.post && (
            <div className="mb-3 rounded border border-quiet-border bg-quiet-aged p-3">
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={avatarUrl(report.post.profiles?.avatar_emoji ?? "house")}
                  alt="avatar"
                  className="h-5 w-5 rounded-full object-cover"
                />
                <span className="text-xs font-medium text-quiet-slate">
                  {report.post.profiles?.display_name ?? "Neighbor"}
                </span>
              </div>
              <p className="text-sm text-quiet-slate line-clamp-3">
                {report.post.content}
              </p>
            </div>
          )}

          {/* Reporter and reason */}
          <div className="text-xs text-quiet-muted mb-3">
            <span>
              Reported by{" "}
              <span className="font-medium text-quiet-slate">
                {report.reporter?.display_name ?? "Unknown"}
              </span>
            </span>
            {report.reason && (
              <p className="mt-1 italic">"{report.reason}"</p>
            )}
          </div>

          {/* Actions */}
          {report.status === "pending" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={loadingId === report.id}
                onClick={() => handleAction(report.id, "reviewed")}
              >
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                Mark reviewed
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={loadingId === report.id}
                onClick={() => handleAction(report.id, "dismissed")}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Dismiss
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
