import { useEffect, useState, useCallback } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { Profile, Post, Circle } from "@/types"
import { slugify } from "@/types"

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
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
      // Fire-and-forget — don't block auth on this
      if (data.session?.user) {
        ensureProfile(data.session.user.id).catch(() => {})
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        ensureProfile(session.user.id).catch(() => {})
      }
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
    if (!userId) {
      setLoading(false)
      return
    }
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
    username?: string
  }) => {
    if (!userId) return { error: new Error("No user") }

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...updates })

    if (!error) await fetchProfile()
    return { error }
  }

  const needsSetup = profile?.display_name === "Neighbor" || !profile?.username

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
    const slug = slugify(name)
    const { data, error } = await supabase
      .from("circles")
      .insert({ name, slug, description, created_by: userId })
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

  const leaveCircle = async (circleId: string) => {
    const { error } = await supabase
      .from("circle_members")
      .delete()
      .eq("circle_id", circleId)
      .eq("user_id", userId)

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

  return { circles, loading, createCircle, joinCircle, leaveCircle, updateCircle, refetch: fetchCircles }
}

// ─── Circle members ─────────────────────────────────

export interface CircleMember {
  display_name: string
  avatar_emoji: string
  username: string
}

export function useCircleMembers(circleId: string | undefined) {
  const [members, setMembers] = useState<CircleMember[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!circleId) {
      setLoading(false)
      return
    }
    setLoading(true)

    supabase
      .from("circle_members")
      .select("profiles(display_name, avatar_emoji, username)")
      .eq("circle_id", circleId)
      .then(({ data, error }) => {
        if (!error && data) {
          const mapped = data
            .map((row) => (row as Record<string, unknown>).profiles as CircleMember)
            .filter(Boolean)
          setMembers(mapped)
          setCount(mapped.length)
        }
        setLoading(false)
      })
  }, [circleId])

  return { members, count, loading }
}

// ─── All circles (for discovery) ─────────────────────

export function useAllCircles() {
  const [allCircles, setAllCircles] = useState<Circle[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("circles")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setAllCircles(data as Circle[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { allCircles, loading, refetch: fetchAll }
}

// ─── Circle by slug ──────────────────────────────────

export function useCircleBySlug(slug: string | undefined) {
  const [circle, setCircle] = useState<Circle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }
    setLoading(true)

    supabase
      .from("circles")
      .select("*")
      .eq("slug", slug)
      .single()
      .then(({ data }) => {
        if (data) setCircle(data as Circle)
        setLoading(false)
      })
  }, [slug])

  return { circle, loading }
}

// ─── Public profile ──────────────────────────────────

export function usePublicProfile(username: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!username) {
      setLoading(false)
      return
    }
    setLoading(true)

    supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as Profile)
        setLoading(false)
      })
  }, [username])

  return { profile, loading }
}

// ─── All-circles posts (for home feed) ──────────────

export function useAllMemberPosts(circleIds: string[], userId?: string) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const key = circleIds.slice().sort().join(",")

  const enrichWithUpvotes = useCallback(
    async (rawPosts: Record<string, unknown>[]): Promise<Post[]> => {
      const fallback = rawPosts.map((p) => ({
        ...p,
        tags: (p.tags as string[]) || [],
        upvote_count: 0,
        user_upvoted: false,
      })) as Post[]

      if (rawPosts.length === 0) return fallback

      try {
        const postIds = rawPosts.map((p) => p.id as string)

        const [countsRes, userRes] = await Promise.all([
          supabase
            .from("post_upvotes")
            .select("post_id")
            .in("post_id", postIds),
          userId
            ? supabase
                .from("post_upvotes")
                .select("post_id")
                .in("post_id", postIds)
                .eq("user_id", userId)
            : null,
        ])

        if (countsRes.error) return fallback

        const countMap: Record<string, number> = {}
        for (const row of countsRes.data ?? []) {
          countMap[row.post_id] = (countMap[row.post_id] || 0) + 1
        }

        const userSet = new Set<string>()
        for (const row of userRes?.data ?? []) {
          userSet.add(row.post_id)
        }

        return rawPosts.map((p) => ({
          ...p,
          upvote_count: countMap[p.id as string] || 0,
          user_upvoted: userSet.has(p.id as string),
        })) as Post[]
      } catch {
        return fallback
      }
    },
    [userId]
  )

  const fetchPosts = useCallback(async () => {
    if (circleIds.length === 0) {
      setPosts([])
      setLoading(false)
      return
    }
    setLoading(true)

    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles!posts_author_id_fkey(display_name, avatar_emoji, username)")
      .in("circle_id", circleIds)
      .or(`is_welcome.eq.true,expires_at.gt.${new Date().toISOString()}`)
      .order("created_at", { ascending: false })

    if (!error && data) {
      try {
        const enriched = await enrichWithUpvotes(data)
        setPosts(enriched)
      } catch {
        setPosts(data as Post[])
      }
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enrichWithUpvotes])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const toggleUpvote = async (postId: string) => {
    if (!userId) return

    const post = posts.find((p) => p.id === postId)
    if (!post) return

    const wasUpvoted = post.user_upvoted

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              user_upvoted: !wasUpvoted,
              upvote_count: p.upvote_count + (wasUpvoted ? -1 : 1),
            }
          : p
      )
    )

    const { error } = wasUpvoted
      ? await supabase
          .from("post_upvotes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId)
      : await supabase
          .from("post_upvotes")
          .insert({ post_id: postId, user_id: userId })

    if (error) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                user_upvoted: wasUpvoted,
                upvote_count: p.upvote_count + (wasUpvoted ? 1 : -1),
              }
            : p
        )
      )
    }
  }

  const deletePost = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)

    if (error) await fetchPosts()
    return error
  }

  return { posts, loading, toggleUpvote, deletePost, refetch: fetchPosts }
}

// ─── Posts ───────────────────────────────────────────

export function usePosts(circleId: string | undefined, userId?: string) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const enrichWithUpvotes = useCallback(
    async (rawPosts: Record<string, unknown>[]): Promise<Post[]> => {
      // Default: posts with zeroed upvote fields
      const fallback = rawPosts.map((p) => ({
        ...p,
        tags: (p.tags as string[]) || [],
        upvote_count: 0,
        user_upvoted: false,
      })) as Post[]

      if (rawPosts.length === 0) return fallback

      try {
        const postIds = rawPosts.map((p) => p.id as string)

        const [countsRes, userRes] = await Promise.all([
          supabase
            .from("post_upvotes")
            .select("post_id")
            .in("post_id", postIds),
          userId
            ? supabase
                .from("post_upvotes")
                .select("post_id")
                .in("post_id", postIds)
                .eq("user_id", userId)
            : null,
        ])

        if (countsRes.error) return fallback

        const countMap: Record<string, number> = {}
        for (const row of countsRes.data ?? []) {
          countMap[row.post_id] = (countMap[row.post_id] || 0) + 1
        }

        const userSet = new Set<string>()
        for (const row of userRes?.data ?? []) {
          userSet.add(row.post_id)
        }

        return rawPosts.map((p) => ({
          ...p,
          upvote_count: countMap[p.id as string] || 0,
          user_upvoted: userSet.has(p.id as string),
        })) as Post[]
      } catch {
        return fallback
      }
    },
    [userId]
  )

  const fetchPosts = useCallback(async () => {
    if (!circleId) return
    setLoading(true)

    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles!posts_author_id_fkey(display_name, avatar_emoji, username)")
      .eq("circle_id", circleId)
      .or(`is_welcome.eq.true,expires_at.gt.${new Date().toISOString()}`)
      .order("is_welcome", { ascending: false })
      .order("created_at", { ascending: false })

    console.log("[fetchPosts]", { circleId, error, rowCount: data?.length ?? 0 })
    if (!error && data) {
      try {
        const enriched = await enrichWithUpvotes(data)
        setPosts(enriched)
      } catch {
        setPosts(data as Post[])
      }
    }
    setLoading(false)
  }, [circleId, enrichWithUpvotes])

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
            .select("*, profiles!posts_author_id_fkey(display_name, avatar_emoji, username)")
            .eq("id", payload.new.id)
            .single()

          if (data) {
            let post: Post
            try {
              const [enriched] = await enrichWithUpvotes([data])
              post = enriched
            } catch {
              post = data as Post
            }
            setPosts((prev) => {
              if (prev.some((p) => p.id === post.id)) return prev
              return [post, ...prev]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [circleId, enrichWithUpvotes])

  const toggleUpvote = async (postId: string) => {
    if (!userId) return

    const post = posts.find((p) => p.id === postId)
    if (!post) return

    const wasUpvoted = post.user_upvoted

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              user_upvoted: !wasUpvoted,
              upvote_count: p.upvote_count + (wasUpvoted ? -1 : 1),
            }
          : p
      )
    )

    const { error } = wasUpvoted
      ? await supabase
          .from("post_upvotes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId)
      : await supabase
          .from("post_upvotes")
          .insert({ post_id: postId, user_id: userId })

    // Revert on error
    if (error) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                user_upvoted: wasUpvoted,
                upvote_count: p.upvote_count + (wasUpvoted ? 1 : -1),
              }
            : p
        )
      )
    }
  }

  const createPost = async (
    content: string,
    durationSeconds: number,
    authorId: string,
    tags: string[] = []
  ) => {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + durationSeconds * 1000)

    const { error } = await supabase.from("posts").insert({
      circle_id: circleId,
      author_id: authorId,
      content,
      expires_at: expiresAt.toISOString(),
      original_duration_seconds: durationSeconds,
      tags,
    })

    console.log("[createPost]", { circleId, authorId, error })
    return error
  }

  const deletePost = async (postId: string) => {
    // Optimistic removal
    setPosts((prev) => prev.filter((p) => p.id !== postId))

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)

    if (error) await fetchPosts()
    return error
  }

  return { posts, loading, createPost, deletePost, toggleUpvote, refetch: fetchPosts }
}
