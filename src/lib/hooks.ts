import { useEffect, useState, useCallback } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { Profile, Post, Circle, CircleRole, AdminCircleMember, Report, BannedUser, Reply, NotificationPreferences, Notification, CircleTag } from "@/types"
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
      // Check if user has a session but no rememberMe flag
      // This means browser was closed and user didn't want to stay logged in
      if (data.session && !sessionStorage.getItem('rememberMe')) {
        supabase.auth.signOut()
        setSession(null)
        setLoading(false)
        return
      }

      setSession(data.session)
      setLoading(false)
      // Fire-and-forget — don't block auth on this
      if (data.session?.user) {
        ensureProfile(data.session.user.id).catch(() => {})
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (session?.user) {
        ensureProfile(session.user.id).catch(() => {})
      }
      // Auto-remember magic link sign-ins
      if (event === 'SIGNED_IN' && session && !sessionStorage.getItem('rememberMe')) {
        sessionStorage.setItem('rememberMe', 'true')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const user: User | null = session?.user ?? null

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })

    if (!error) {
      // Auto-remember new users
      sessionStorage.setItem('rememberMe', 'true')
    }

    return error
  }

  const signIn = async (email: string, password: string, rememberMe = true) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error) {
      if (rememberMe) {
        // Set a flag in sessionStorage to indicate the user wants to be remembered
        // This flag persists across page reloads but is cleared when browser closes
        sessionStorage.setItem('rememberMe', 'true')
      } else {
        // Don't set the flag - session will be cleared when browser closes
        sessionStorage.removeItem('rememberMe')
      }
    }

    return error
  }

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    return error
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return error
  }

  const signOut = async () => {
    sessionStorage.removeItem('rememberMe')
    await supabase.auth.signOut()
  }

  const leaveAllCircles = async () => {
    if (!user) return
    const { error } = await supabase
      .from("circle_members")
      .delete()
      .eq("user_id", user.id)
    if (error) throw error
  }

  const deleteAccount = async () => {
    const { error } = await supabase.rpc("delete_own_account")
    if (error) throw error
    await supabase.auth.signOut()
  }

  return { session, user, loading, signUp, signIn, signInWithMagicLink, resetPassword, signOut, leaveAllCircles, deleteAccount }
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
    country?: string | null
    links?: { label: string; url: string }[] | null
    posts_public?: boolean
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
  const [circleRoles, setCircleRoles] = useState<Record<string, CircleRole>>({})
  const [loading, setLoading] = useState(true)

  const fetchCircles = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    // Fetch circles the user is a member of, including role
    const { data, error } = await supabase
      .from("circle_members")
      .select("circle_id, role, circles(*)")
      .eq("user_id", userId)

    if (!error && data) {
      const mapped = data
        .map((row) => row.circles as unknown as Circle)
        .filter(Boolean)
      setCircles(mapped)

      const roles: Record<string, CircleRole> = {}
      for (const row of data) {
        if (row.circle_id && row.role) {
          roles[row.circle_id] = row.role as CircleRole
        }
      }
      setCircleRoles(roles)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchCircles()
  }, [fetchCircles])

  const createCircle = async (name: string, description?: string, country?: string | null) => {
    const slug = slugify(name)
    const { data, error } = await supabase
      .from("circles")
      .insert({ name, slug, description, country, created_by: userId })
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

  const uploadCircleAvatar = async (circleId: string, file: File) => {
    const path = `${circleId}`
    const { error: uploadError } = await supabase.storage
      .from("circle-avatars")
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadError) return { url: null, error: uploadError }

    const { data: urlData } = supabase.storage
      .from("circle-avatars")
      .getPublicUrl(path)

    const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`
    const { error: updateError } = await supabase
      .from("circles")
      .update({ avatar_url })
      .eq("id", circleId)

    if (!updateError) await fetchCircles()
    return { url: updateError ? null : avatar_url, error: updateError }
  }

  const updateCircle = async (
    circleId: string,
    updates: { name?: string; slug?: string; description?: string | null; about?: string | null; rules?: string | null; country?: string | null; links?: { label: string; url: string }[] | null; banner_color?: string | null; avatar_url?: string | null; default_permanent_posts?: boolean }
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

  const deleteCircle = async (circleId: string) => {
    const { error } = await supabase
      .from("circles")
      .delete()
      .eq("id", circleId)

    if (!error) await fetchCircles()
    return error
  }

  return { circles, circleRoles, loading, createCircle, joinCircle, leaveCircle, updateCircle, uploadCircleAvatar, deleteCircle, refetch: fetchCircles }
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
      .select("profiles(display_name, avatar_emoji, username, is_bot)")
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
    const MAX_RETRIES = 2

    const attemptFetch = async (retryCount = 0): Promise<void> => {
      const { data, error } = await supabase
        .from("circles")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setAllCircles(data as Circle[])
        setLoading(false)
      } else if (error) {
        // Check if it's an auth error
        const isAuthError =
          error.code === 'PGRST301' || // JWT expired
          error.code === 'PGRST302' || // JWT invalid
          error.message?.toLowerCase().includes('jwt') ||
          error.message?.toLowerCase().includes('auth')

        if (isAuthError && retryCount < MAX_RETRIES) {
          console.log(`Auth error fetching circles, retrying... (attempt ${retryCount + 1}/${MAX_RETRIES})`)
          await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)))
          await attemptFetch(retryCount + 1)
        } else {
          console.error('Error fetching all circles:', error)
          setLoading(false)
        }
      }
    }

    setLoading(true)
    await attemptFetch()
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

  const fetchCircle = useCallback(async () => {
    if (!slug) {
      setLoading(false)
      return
    }
    setLoading(true)

    const { data } = await supabase
      .from("circles")
      .select("*")
      .eq("slug", slug)
      .single()

    if (data) setCircle(data as Circle)
    setLoading(false)
  }, [slug])

  useEffect(() => {
    fetchCircle()
  }, [fetchCircle])

  return { circle, loading, refetch: fetchCircle }
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

// ─── User posts (for public profile) ─────────────────

export function useUserPosts(userId: string | undefined) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)

    supabase
      .from("posts")
      .select("*, profiles!posts_author_id_fkey(display_name, avatar_emoji, username, is_bot), circles(name, slug, description, avatar_url)")
      .eq("author_id", userId)
      .eq("is_welcome", false)
      .or(`is_permanent.eq.true,expires_at.gt.${new Date().toISOString()}`)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setPosts(data as Post[])
        setLoading(false)
      })
  }, [userId])

  return { posts, loading }
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
        user_replied: false,
        reply_count: 0,
      })) as Post[]

      if (rawPosts.length === 0) return fallback

      try {
        const postIds = rawPosts.map((p) => p.id as string)

        const [countsRes, userRes, replyCountsRes, userReplyRes] = await Promise.all([
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
          supabase
            .from("replies")
            .select("post_id")
            .in("post_id", postIds),
          userId
            ? supabase
                .from("replies")
                .select("post_id")
                .in("post_id", postIds)
                .eq("author_id", userId)
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

        const replyCountMap: Record<string, number> = {}
        for (const row of replyCountsRes.data ?? []) {
          replyCountMap[row.post_id] = (replyCountMap[row.post_id] || 0) + 1
        }

        const userRepliedSet = new Set<string>()
        for (const row of userReplyRes?.data ?? []) {
          userRepliedSet.add(row.post_id)
        }

        return rawPosts.map((p) => ({
          ...p,
          upvote_count: countMap[p.id as string] || 0,
          user_upvoted: userSet.has(p.id as string),
          user_replied: userRepliedSet.has(p.id as string),
          reply_count: replyCountMap[p.id as string] || 0,
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
      .select("*, profiles!posts_author_id_fkey(display_name, avatar_emoji, username, is_bot), circles(name, slug, description, avatar_url)")
      .in("circle_id", circleIds)
      .or(`is_welcome.eq.true,is_permanent.eq.true,expires_at.gt.${new Date().toISOString()}`)
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

  const makePermanent = async (postId: string, permanent: boolean) => {
    const post = posts.find((p) => p.id === postId)
    if (!post) return

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_permanent: permanent,
              expires_at: permanent ? 'infinity' : new Date(Date.now() + p.original_duration_seconds * 1000).toISOString()
            }
          : p
      )
    )

    const { error } = await supabase
      .from("posts")
      .update({
        is_permanent: permanent,
        expires_at: permanent ? 'infinity' : new Date(Date.now() + post.original_duration_seconds * 1000).toISOString()
      })
      .eq("id", postId)

    if (error) {
      console.error("Failed to update post permanence:", error)
      await fetchPosts() // Revert on error
    }

    return error
  }

  const updatePost = async (postId: string, content: string, tags: string[] = []) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              content,
              tags,
              edited: true,
              updated_at: new Date().toISOString(),
            }
          : p
      )
    )

    const { error } = await supabase
      .from("posts")
      .update({
        content,
        tags,
        edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .select()
      .single()

    // Revert on error
    if (error) {
      await fetchPosts()
    }

    return error
  }

  return { posts, loading, toggleUpvote, updatePost, deletePost, makePermanent, refetch: fetchPosts }
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
        user_replied: false,
        reply_count: 0,
      })) as Post[]

      if (rawPosts.length === 0) return fallback

      try {
        const postIds = rawPosts.map((p) => p.id as string)

        const [countsRes, userRes, replyCountsRes] = await Promise.all([
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
          supabase
            .from("replies")
            .select("post_id")
            .in("post_id", postIds),
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

        const replyCountMap: Record<string, number> = {}
        for (const row of replyCountsRes.data ?? []) {
          replyCountMap[row.post_id] = (replyCountMap[row.post_id] || 0) + 1
        }

        return rawPosts.map((p) => ({
          ...p,
          upvote_count: countMap[p.id as string] || 0,
          user_upvoted: userSet.has(p.id as string),
          user_replied: false,
          reply_count: replyCountMap[p.id as string] || 0,
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
      .select("*, profiles!posts_author_id_fkey(display_name, avatar_emoji, username, is_bot)")
      .eq("circle_id", circleId)
      .or(`is_welcome.eq.true,is_permanent.eq.true,expires_at.gt.${new Date().toISOString()}`)
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
            .select("*, profiles!posts_author_id_fkey(display_name, avatar_emoji, username, is_bot)")
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
    tags: string[] = [],
    imageUrl?: string | null
  ) => {
    const isPermanent = durationSeconds === 0
    const now = new Date()
    const expiresAt = isPermanent ? 'infinity' : new Date(now.getTime() + durationSeconds * 1000).toISOString()

    const { error } = await supabase.from("posts").insert({
      circle_id: circleId,
      author_id: authorId,
      content,
      expires_at: expiresAt,
      original_duration_seconds: durationSeconds,
      is_permanent: isPermanent,
      tags,
      image_url: imageUrl,
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

  const makePermanent = async (postId: string, permanent: boolean) => {
    const post = posts.find((p) => p.id === postId)
    if (!post) return

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_permanent: permanent,
              expires_at: permanent ? 'infinity' : new Date(Date.now() + p.original_duration_seconds * 1000).toISOString()
            }
          : p
      )
    )

    const { error } = await supabase
      .from("posts")
      .update({
        is_permanent: permanent,
        expires_at: permanent ? 'infinity' : new Date(Date.now() + post.original_duration_seconds * 1000).toISOString()
      })
      .eq("id", postId)

    if (error) {
      console.error("Failed to update post permanence:", error)
      await fetchPosts() // Revert on error
    }

    return error
  }

  const updatePost = async (postId: string, content: string, tags: string[] = []) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              content,
              tags,
              edited: true,
              updated_at: new Date().toISOString(),
            }
          : p
      )
    )

    const { error } = await supabase
      .from("posts")
      .update({
        content,
        tags,
        edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .select()
      .single()

    // Revert on error
    if (error) {
      await fetchPosts()
    }

    return error
  }

  return { posts, loading, createPost, updatePost, deletePost, toggleUpvote, makePermanent, refetch: fetchPosts }
}


// ─── Replies ─────────────────────────────────────────

export function useReplies(postId: string | undefined, userId?: string) {
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)

  const enrichRepliesWithUpvotes = useCallback(
    async (rawReplies: Record<string, unknown>[]): Promise<Reply[]> => {
      const fallback = rawReplies.map((r) => ({
        ...r,
        upvote_count: 0,
        user_upvoted: false,
      })) as Reply[]

      if (rawReplies.length === 0) return fallback

      try {
        const replyIds = rawReplies.map((r) => r.id as string)

        const [countsRes, userRes] = await Promise.all([
          supabase
            .from("reply_upvotes")
            .select("reply_id")
            .in("reply_id", replyIds),
          userId
            ? supabase
                .from("reply_upvotes")
                .select("reply_id")
                .in("reply_id", replyIds)
                .eq("user_id", userId)
            : null,
        ])

        if (countsRes.error) return fallback

        const countMap: Record<string, number> = {}
        for (const row of countsRes.data ?? []) {
          countMap[row.reply_id] = (countMap[row.reply_id] || 0) + 1
        }

        const userSet = new Set<string>()
        for (const row of userRes?.data ?? []) {
          userSet.add(row.reply_id)
        }

        return rawReplies.map((r) => ({
          ...r,
          upvote_count: countMap[r.id as string] || 0,
          user_upvoted: userSet.has(r.id as string),
        })) as Reply[]
      } catch {
        return fallback
      }
    },
    [userId]
  )

  const fetchReplies = useCallback(async () => {
    if (!postId) return
    setLoading(true)

    const { data, error } = await supabase
      .from("replies")
      .select("*, profiles!replies_author_id_fkey(display_name, avatar_emoji, username, is_bot)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })

    console.log("[fetchReplies]", { postId, error, rowCount: data?.length ?? 0, data })
    if (!error && data) {
      try {
        const enriched = await enrichRepliesWithUpvotes(data)
        setReplies(enriched)
      } catch {
        setReplies(data as Reply[])
      }
    }
    setLoading(false)
  }, [postId, enrichRepliesWithUpvotes])

  useEffect(() => {
    fetchReplies()
  }, [fetchReplies])

  // Realtime subscription for new replies
  useEffect(() => {
    if (!postId) return

    const channel = supabase
      .channel(`replies:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "replies",
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("replies")
            .select("*, profiles!replies_author_id_fkey(display_name, avatar_emoji, username, is_bot)")
            .eq("id", payload.new.id)
            .single()

          if (data) {
            let reply: Reply
            try {
              const [enriched] = await enrichRepliesWithUpvotes([data])
              reply = enriched
            } catch {
              reply = data as Reply
            }
            setReplies((prev) => {
              if (prev.some((r) => r.id === reply.id)) return prev
              return [...prev, reply]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, enrichRepliesWithUpvotes])

  const createReply = async (content: string, authorId: string) => {
    const { error } = await supabase.from("replies").insert({
      post_id: postId,
      author_id: authorId,
      content,
    })

    console.log("[createReply]", { postId, authorId, error })
    if (!error) await fetchReplies()
    return error
  }

  const deleteReply = async (replyId: string) => {
    setReplies((prev) => prev.filter((r) => r.id !== replyId))

    const { error } = await supabase
      .from("replies")
      .delete()
      .eq("id", replyId)

    if (error) await fetchReplies()
    return error
  }

  const toggleReplyUpvote = async (replyId: string) => {
    if (!userId) return

    const reply = replies.find((r) => r.id === replyId)
    if (!reply) return

    const wasUpvoted = reply.user_upvoted

    setReplies((prev) =>
      prev.map((r) =>
        r.id === replyId
          ? {
              ...r,
              user_upvoted: !wasUpvoted,
              upvote_count: r.upvote_count + (wasUpvoted ? -1 : 1),
            }
          : r
      )
    )

    const { error } = wasUpvoted
      ? await supabase
          .from("reply_upvotes")
          .delete()
          .eq("reply_id", replyId)
          .eq("user_id", userId)
      : await supabase
          .from("reply_upvotes")
          .insert({ reply_id: replyId, user_id: userId })

    if (error) {
      setReplies((prev) =>
        prev.map((r) =>
          r.id === replyId
            ? {
                ...r,
                user_upvoted: wasUpvoted,
                upvote_count: r.upvote_count + (wasUpvoted ? 1 : -1),
              }
            : r
        )
      )
    }
  }

  return { replies, loading, createReply, deleteReply, toggleReplyUpvote, refetch: fetchReplies }
}

// ─── Admin Hooks ──────────────────────────────────────

/** Circles where the current user is admin or moderator */
export function useAdminCircles(userId: string | undefined) {
  const [adminCircles, setAdminCircles] = useState<(Circle & { role: CircleRole })[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAdminCircles = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)

    // Fetch circles where user has admin/mod role in circle_members
    const { data, error } = await supabase
      .from("circle_members")
      .select("role, circles(*)")
      .eq("user_id", userId)
      .in("role", ["admin", "moderator"])

    // Also fetch circles the user created (they may be missing from circle_members)
    const { data: createdData } = await supabase
      .from("circles")
      .select("*")
      .eq("created_by", userId)

    const mapped = new Map<string, Circle & { role: CircleRole }>()

    if (!error && data) {
      for (const row of data) {
        const circle = row.circles as unknown as Circle
        if (circle) mapped.set(circle.id, { ...circle, role: row.role as CircleRole })
      }
    }

    // Add created circles as admin if not already present
    if (createdData) {
      for (const circle of createdData) {
        if (!mapped.has(circle.id)) {
          mapped.set(circle.id, { ...circle, role: "admin" as CircleRole })
        }
      }
    }

    setAdminCircles(Array.from(mapped.values()))
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchAdminCircles()
  }, [fetchAdminCircles])

  return { adminCircles, loading, refetch: fetchAdminCircles }
}

/** Members of a circle with roles and stats, plus mutation helpers */
export function useAdminMembers(circleId: string | undefined) {
  const [members, setMembers] = useState<AdminCircleMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async () => {
    if (!circleId) return
    setLoading(true)

    const { data, error } = await supabase
      .from("circle_members")
      .select("user_id, role, joined_at, profiles(display_name, avatar_emoji, username, is_bot)")
      .eq("circle_id", circleId)

    if (!error && data) {
      // Get post counts and upvote counts for each member
      const userIds = data.map((row) => row.user_id)

      const [postsRes, upvotesRes] = await Promise.all([
        supabase
          .from("posts")
          .select("author_id")
          .eq("circle_id", circleId)
          .in("author_id", userIds),
        supabase
          .from("post_upvotes")
          .select("user_id")
          .in("user_id", userIds),
      ])

      const postCounts: Record<string, number> = {}
      for (const row of postsRes.data ?? []) {
        postCounts[row.author_id] = (postCounts[row.author_id] || 0) + 1
      }

      const upvoteCounts: Record<string, number> = {}
      for (const row of upvotesRes.data ?? []) {
        upvoteCounts[row.user_id] = (upvoteCounts[row.user_id] || 0) + 1
      }

      const mapped: AdminCircleMember[] = data.map((row) => {
        const prof = (row as Record<string, unknown>).profiles as {
          display_name: string
          avatar_emoji: string
          username: string
          is_bot?: boolean
        }
        return {
          user_id: row.user_id,
          display_name: prof?.display_name ?? "Neighbor",
          avatar_emoji: prof?.avatar_emoji ?? "house",
          username: prof?.username ?? "",
          is_bot: prof?.is_bot ?? false,
          role: row.role as CircleRole,
          joined_at: row.joined_at,
          post_count: postCounts[row.user_id] || 0,
          upvote_count: upvoteCounts[row.user_id] || 0,
        }
      })

      setMembers(mapped)
    }
    setLoading(false)
  }, [circleId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const updateRole = async (userId: string, role: CircleRole) => {
    const { error } = await supabase
      .from("circle_members")
      .update({ role })
      .eq("circle_id", circleId)
      .eq("user_id", userId)

    if (!error) {
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role } : m))
      )
    }
    return error
  }

  const removeMember = async (userId: string) => {
    const { error } = await supabase
      .from("circle_members")
      .delete()
      .eq("circle_id", circleId)
      .eq("user_id", userId)

    if (!error) {
      setMembers((prev) => prev.filter((m) => m.user_id !== userId))
    }
    return error
  }

  return { members, loading, updateRole, removeMember, refetch: fetchMembers }
}

/** Reports for a circle with post and reporter joins */
export function useAdminReports(circleId: string | undefined) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = useCallback(async () => {
    if (!circleId) return
    setLoading(true)

    const { data, error } = await supabase
      .from("reports")
      .select(`
        *,
        post:posts(content, author_id, profiles:profiles!posts_author_id_fkey(display_name, avatar_emoji, username, is_bot)),
        reporter:profiles!reports_reported_by_fkey(display_name, avatar_emoji, username)
      `)
      .eq("circle_id", circleId)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setReports(data as unknown as Report[])
    }
    setLoading(false)
  }, [circleId])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const updateReport = async (reportId: string, status: "reviewed" | "dismissed", reviewedBy: string) => {
    const { error } = await supabase
      .from("reports")
      .update({ status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() })
      .eq("id", reportId)

    if (!error) {
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() } : r
        )
      )
    }
    return error
  }

  return { reports, loading, updateReport, refetch: fetchReports }
}

/** Banned users for a circle */
export function useBannedUsers(circleId: string | undefined) {
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBannedUsers = useCallback(async () => {
    if (!circleId) return
    setLoading(true)

    const { data, error } = await supabase
      .from("banned_users")
      .select(`
        *,
        profile:profiles!banned_users_user_id_fkey(display_name, avatar_emoji, username, is_bot),
        banned_by_profile:profiles!banned_users_banned_by_fkey(display_name)
      `)
      .eq("circle_id", circleId)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setBannedUsers(data as unknown as BannedUser[])
    }
    setLoading(false)
  }, [circleId])

  useEffect(() => {
    fetchBannedUsers()
  }, [fetchBannedUsers])

  const banUser = async (userId: string, bannedBy: string, reason: string) => {
    // Insert ban record
    const { error } = await supabase
      .from("banned_users")
      .insert({ circle_id: circleId, user_id: userId, banned_by: bannedBy, reason })

    if (!error) {
      // Also remove from circle members
      await supabase
        .from("circle_members")
        .delete()
        .eq("circle_id", circleId)
        .eq("user_id", userId)

      await fetchBannedUsers()
    }
    return error
  }

  const unbanUser = async (banId: string) => {
    const { error } = await supabase
      .from("banned_users")
      .delete()
      .eq("id", banId)

    if (!error) {
      setBannedUsers((prev) => prev.filter((b) => b.id !== banId))
    }
    return error
  }

  return { bannedUsers, loading, banUser, unbanUser, refetch: fetchBannedUsers }
}

/** Stat counts for admin dashboard */
export function useAdminStats(circleId: string | undefined) {
  const [stats, setStats] = useState({ members: 0, recentPosts: 0, pendingReports: 0, banned: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!circleId) {
      setLoading(false)
      return
    }
    setLoading(true)

    Promise.all([
      supabase
        .from("circle_members")
        .select("user_id", { count: "exact", head: true })
        .eq("circle_id", circleId),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("circle_id", circleId)
        .gt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("circle_id", circleId)
        .eq("status", "pending"),
      supabase
        .from("banned_users")
        .select("id", { count: "exact", head: true })
        .eq("circle_id", circleId),
    ]).then(([membersRes, postsRes, reportsRes, bannedRes]) => {
      setStats({
        members: membersRes.count ?? 0,
        recentPosts: postsRes.count ?? 0,
        pendingReports: reportsRes.count ?? 0,
        banned: bannedRes.count ?? 0,
      })
      setLoading(false)
    })
  }, [circleId])

  return { stats, loading }
}

/** Member counts for a list of circles (used in admin circle selector dropdown) */
export function useAdminCircleMemberCounts(circleIds: string[]) {
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({})

  const key = circleIds.slice().sort().join(",")

  useEffect(() => {
    if (circleIds.length === 0) return

    supabase
      .from("circle_members")
      .select("circle_id")
      .in("circle_id", circleIds)
      .then(({ data, error }) => {
        if (!error && data) {
          const counts: Record<string, number> = {}
          for (const row of data) {
            counts[row.circle_id] = (counts[row.circle_id] || 0) + 1
          }
          setMemberCounts(counts)
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { memberCounts }
}

// ─── Notification Preferences ──────────────────────────────────

export function useNotificationPreferences(userId: string | undefined) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPreferences = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (!error && data) {
      setPreferences(data as NotificationPreferences)
    } else if (error && error.code === 'PGRST116') {
      // Row not found, create default preferences
      const { data: newData } = await supabase
        .from("notification_preferences")
        .insert({ user_id: userId })
        .select()
        .single()

      if (newData) {
        setPreferences(newData as NotificationPreferences)
      }
    }
    setLoading(false)
  }, [userId])

  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      if (!userId) return null

      const { data, error } = await supabase
        .from("notification_preferences")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .select()
        .single()

      if (!error && data) {
        setPreferences(data as NotificationPreferences)
        return null
      }

      return error
    },
    [userId]
  )

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  return { preferences, loading, updatePreferences, refetch: fetchPreferences }
}

// ─── Notifications ────────────────────────────────────

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)

    const { data, error } = await supabase
      .from("notifications")
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(display_name, avatar_emoji, username),
        post:posts!notifications_post_id_fkey(content, circle_id, circles(name, slug))
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (!error && data) {
      setNotifications(data as unknown as Notification[])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          // Refetch to get full joins
          await fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
  }

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false)
  }

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}

// ─── Circle Tags ─────────────────────────────────────

export function useCircleTags(circleId: string | undefined) {
  const [tags, setTags] = useState<CircleTag[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!circleId) { setTags([]); return }
    setLoading(true)
    supabase
      .from("circle_tags")
      .select("*")
      .eq("circle_id", circleId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setTags(data ?? [])
        setLoading(false)
      })
  }, [circleId])

  const createTag = useCallback(async (name: string, color: string) => {
    if (!circleId) return { error: "No circle" }
    const { data, error } = await supabase
      .from("circle_tags")
      .insert({ circle_id: circleId, name: name.trim(), color })
      .select()
      .single()
    if (!error && data) setTags((prev) => [...prev, data as CircleTag])
    return { error }
  }, [circleId])

  const deleteTag = useCallback(async (tagId: string) => {
    const { error } = await supabase.from("circle_tags").delete().eq("id", tagId)
    if (!error) setTags((prev) => prev.filter((t) => t.id !== tagId))
    return { error }
  }, [])

  return { tags, loading, createTag, deleteTag }
}
