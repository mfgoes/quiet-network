import { useState } from "react"
import { Bell, Mail, Calendar, MessageCircle, Check } from "lucide-react"
import { useNotificationPreferences } from "@/lib/hooks"
import { Button } from "@/components/ui/button"

interface NotificationSettingsProps {
  userId: string
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const { preferences, loading, updatePreferences } = useNotificationPreferences(userId)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleToggle = async (key: keyof typeof preferences, value: boolean) => {
    if (!preferences) return

    setSaving(true)
    setSaved(false)

    const error = await updatePreferences({ [key]: value })

    setSaving(false)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-quiet-muted" />
          <h2 className="text-lg font-semibold text-quiet-slate">
            Notification Settings
          </h2>
        </div>
        <p className="text-sm text-quiet-muted">Loading...</p>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-quiet-muted" />
          <h2 className="text-lg font-semibold text-quiet-slate">
            Notification Settings
          </h2>
        </div>
        <p className="text-sm text-quiet-muted">
          Unable to load notification preferences.
        </p>
      </div>
    )
  }

  const settings = [
    {
      key: "notify_on_replies" as const,
      icon: MessageCircle,
      title: "Replies to your posts",
      description: "Get notified when someone replies to your posts or comments",
      enabled: preferences.notify_on_replies,
    },
    {
      key: "notify_on_mentions" as const,
      icon: Mail,
      title: "Mentions",
      description: "Get notified when someone mentions your username",
      enabled: preferences.notify_on_mentions,
    },
    {
      key: "notify_weekly_digest" as const,
      icon: Calendar,
      title: "Weekly digest",
      description: "Receive a weekly summary of activity from your circles",
      enabled: preferences.notify_weekly_digest,
    },
    {
      key: "notify_on_circle_updates" as const,
      icon: Bell,
      title: "Circle updates",
      description: "Get notified about important updates from circles you follow",
      enabled: preferences.notify_on_circle_updates,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-quiet-muted" />
            <h2 className="text-lg font-semibold text-quiet-slate">
              Notification Settings
            </h2>
          </div>
          {saved && (
            <div className="flex items-center gap-1.5 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Saved
            </div>
          )}
        </div>
        <p className="text-sm text-quiet-muted">
          Manage how and when you receive notifications from Quiet Network.
        </p>
      </div>

      {/* Email Notifications */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-quiet-slate">Email Notifications</h3>
        <div className="space-y-2">
          {settings.map((setting) => (
            <div
              key={setting.key}
              className="flex items-start gap-4 rounded-xl border border-quiet-border bg-white p-4"
            >
              <div className="flex-shrink-0 mt-0.5">
                <setting.icon className="h-5 w-5 text-quiet-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium text-quiet-slate">
                      {setting.title}
                    </h4>
                    <p className="text-xs text-quiet-muted leading-relaxed">
                      {setting.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle(setting.key, !setting.enabled)}
                    disabled={saving}
                    className={`
                      relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors
                      ${setting.enabled ? "bg-quiet-accent" : "bg-quiet-border"}
                      ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                    role="switch"
                    aria-checked={setting.enabled}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${setting.enabled ? "translate-x-6" : "translate-x-1"}
                      `}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications (Coming Soon) */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-quiet-slate">Push Notifications</h3>
        <div className="rounded-xl border border-quiet-border bg-quiet-aged p-4">
          <p className="text-xs text-quiet-muted leading-relaxed">
            Push notifications are coming soon. You'll be able to receive instant
            notifications on your devices when they're available.
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-quiet-border bg-quiet-offwhite p-4">
        <p className="text-xs text-quiet-muted leading-relaxed">
          <strong className="text-quiet-slate">Privacy note:</strong> Your notification
          preferences are private and only visible to you. Emails are sent from
          Quiet Network and will never be shared with third parties.
        </p>
      </div>
    </div>
  )
}
