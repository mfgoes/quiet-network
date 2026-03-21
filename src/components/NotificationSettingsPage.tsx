'use client'

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationSettings } from "@/components/NotificationSettings"

interface NotificationSettingsPageProps {
  userId: string
  onBack: () => void
}

export function NotificationSettingsPage({ userId, onBack }: NotificationSettingsPageProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-quiet-muted hover:text-quiet-slate"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold text-quiet-slate">Settings</h1>
      </div>

      {/* Notification Settings Component */}
      <NotificationSettings userId={userId} />
    </div>
  )
}
