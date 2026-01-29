import { useEffect, useState, useCallback } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { Profile, Post, Circle } from "@/types"

// ─── Auth ────────────────────────────────────────────

/** Ensure a profile row exists for the given user (fallback if DB trigger fails) */
async function ensureProfile(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single()

  if (!data) {
    await supabase.from("profiles").insert({ id: userId })
  }
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        try { await ensureProfile(data.session.user.id) } catch {}
      }
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try { await ensureProfile(session.user.id) } catch {}
      }
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const user: User | null = session?.user ?? null

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { session, user, loading, signUp, signIn, signOut }
}

// ─── Profile ────────────────────────────────────────

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (data) setProfile(data as Profile)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = async (updates: {
    display_name: string
    avatar_emoji: string
    bio: string
  }) => {
    if (!userId) return { error: new Error("No user") }

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...updates })

    if (!error) await fetchProfile()
    return { error }
  }

  const needsSetup = profile?.display_name === "Neighbor"

  return { profile, loading, needsSetup, updateProfile, refetch: fetchProfile }
}

// ─── Circles ─────────────────────────────────────────

export function useCircles(userId: string | undefined) {
  const [circles, setCircles] = useState<Circle[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCircles = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    // Fetch circles the user is a member of
    const { data, error } = await supabase
      .from("circle_members")
      .select("circle_id, circles(*)")
      .eq("user_id", userId)

    if (!error && data) {
      const mapped = data
        .map((row) => row.circles as unknown as Circle)
        .filter(Boolean)
      setCircles(mapped)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchCircles()
  }, [fetchCircles])

  const createCircle = async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from("circles")
      .insert({ name, description, created_by: userId })
      .select()
      .single()

    if (error || !data) return { error }

    // Auto-join the creator
    await supabase
      .from("circle_members")
      .insert({ circle_id: data.id, user_id: userId })

    await fetchCircles()
    return { data, error: null }
  }

  const joinCircle = async (circleId: string) => {
    const { error } = await supabase
      .from("circle_members")
      .insert({ circle_id: circleId, user_id: userId })

    if (!error) await fetchCircles()
    return error
  }

  const updateCircle = async (
    circleId: string,
    updates: { about?: string | null; rules?: string | null }
  ) => {
    const { data, error } = await supabase
      .from("circles")
      .update(updates)
      .eq("id", circleId)
      .select()
      .single()

    if (!error) await fetchCircles()
    return { data: data as Circle | null, error }
  }

  return { circles, loading, createCircle, joinCircle, updateCircle, refetch: fetchCircles }
}

// ─── Posts ───────────────────────────────────────────

export function usePosts(circleId: string | undefined) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    if (!circleId) return
    setLoading(true)

    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(display_name, avatar_emoji)")
      .eq("circle_id", circleId)
      .or(`is_welcome.eq.true,expires_at.gt.${new Date().toISOString()}`)
      .order("is_welcome", { ascending: false })
      .order("created_at", { ascending: false })

    if (!error && data) {
      setPosts(data as Post[])
    }
    setLoading(false)
  }, [circleId])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Subscribe to realtime inserts
  useEffect(() => {
    if (!circleId) return

    const channel = supabase
      .channel(`posts:${circleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `circle_id=eq.${circleId}`,
        },
        async (payload) => {
          // Fetch the full post with profile join
          const { data } = await supabase
            .from("posts")
            .select("*, profiles(display_name, avatar_emoji)")
            .eq("id", payload.new.id)
            .single()

          if (data) {
            setPosts((prev) => {
              if (prev.some((p) => p.id === data.id)) return prev
              return [data as Post, ...prev]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [circleId])

  const createPost = async (
    content: string,
    durationSeconds: number,
    authorId: string
  ) => {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + durationSeconds * 1000)

    const { error } = await supabase.from("posts").insert({
      circle_id: circleId,
      author_id: authorId,
      content,
      expires_at: expiresAt.toISOString(),
      original_duration_seconds: durationSeconds,
    })

    return error
  }

  return { posts, loading, createPost, refetch: fetchPosts }
}
