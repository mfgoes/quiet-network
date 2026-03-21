'use client'

import { createContext, useCallback, useContext, useState } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface DMContextValue {
  isOpen: boolean
  activeConversationId: string | null
  userId: string | null
  openPanel: (conversationId?: string) => void
  closePanel: () => void
  startDM: (otherUserId: string) => Promise<void>
}

const DMContext = createContext<DMContextValue>({
  isOpen: false,
  activeConversationId: null,
  userId: null,
  openPanel: () => {},
  closePanel: () => {},
  startDM: async () => {},
})

export function DMProvider({
  userId,
  children,
}: {
  userId: string | null
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  const openPanel = useCallback((conversationId?: string) => {
    setActiveConversationId(conversationId ?? null)
    setIsOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    setIsOpen(false)
  }, [])

  const startDM = useCallback(async (otherUserId: string) => {
    if (!userId) return
    const { data, error } = await supabase.rpc("get_or_create_conversation", { other_user_id: otherUserId })
    if (error) {
      console.error("DM error:", error)
      toast.error("Couldn't open conversation.")
      return
    }
    openPanel(data)
  }, [userId, openPanel])

  return (
    <DMContext.Provider value={{ isOpen, activeConversationId, userId, openPanel, closePanel, startDM }}>
      {children}
    </DMContext.Provider>
  )
}

export function useDM() {
  return useContext(DMContext)
}
