import { useEffect, useState, useCallback } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { Profile, Post, Circle, CircleRole, AdminCircleMember, Report, BannedUser } from "@/types"
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

  return { session, user, loading, signUp, signIn, signOut, leaveAllCircles, deleteAccount }
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

  const deleteCircle = async (circleId: string) => {
    const { error } = await supabase
      .from("circles")
      .delete()
      .eq("id", circleId)

    if (!error) await fetchCircles()
    return error
  }

  return { circles, circleRoles, loading, createCircle, joinCircle, leaveCircle, updateCircle, deleteCircle, refetch: fetchCircles }
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


// ─── Admin Hooks ──────────────────────────────────────

/** Circles where the current user is admin or moderator */
export function useAdminCircles(userId: string | undefined) {
  const [adminCircles, setAdminCircles] = useState<(Circle & { role: CircleRole })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)

    supabase
      .from("circle_members")
      .select("role, circles(*)")
      .eq("user_id", userId)
      .in("role", ["admin", "moderator"])
      .then(({ data, error }) => {
        if (!error && data) {
          const mapped = data
            .map((row) => {
              const circle = row.circles as unknown as Circle
              if (!circle) return null
              return { ...circle, role: row.role as CircleRole }
            })
            .filter(Boolean) as (Circle & { role: CircleRole })[]
          setAdminCircles(mapped)
        }
        setLoading(false)
      })
  }, [userId])

  return { adminCircles, loading }
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
      .select("user_id, role, joined_at, profiles(display_name, avatar_emoji, username)")
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
        }
        return {
          user_id: row.user_id,
          display_name: prof?.display_name ?? "Neighbor",
          avatar_emoji: prof?.avatar_emoji ?? "house",
          username: prof?.username ?? "",
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
        post:posts(content, author_id, profiles:profiles!posts_author_id_fkey(display_name, avatar_emoji, username)),
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
        profile:profiles!banned_users_user_id_fkey(display_name, avatar_emoji, username),
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
