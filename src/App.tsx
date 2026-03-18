import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from "react-router-dom"
import { HelmetProvider } from "react-helmet-async"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth, useProfile, useCircles, useAllCircles, usePublicProfile, useUserPosts, useAdminCircles, useNotifications } from "@/lib/hooks"
import { AuthForm } from "@/components/AuthForm"
import { ProfileSetup } from "@/components/ProfileSetup"
import { ProfilePage } from "@/components/ProfilePage"
import { PublicProfilePage } from "@/components/PublicProfilePage"
import { AboutPage } from "@/components/AboutPage"
import { NotificationSettingsPage } from "@/components/NotificationSettingsPage"
import { NotificationsPage } from "@/components/NotificationsPage"
import { BottomNav } from "@/components/BottomNav"
import { Sidebar } from "@/components/Sidebar"
import { MobileMenu } from "@/components/MobileMenu"
import { Shell } from "@/components/Shell"
import { AdminPanel } from "@/components/AdminPanel"
import { HomeFeed } from "@/components/HomeFeed"
import { CircleFeedRoute, PublicCircleFeedRoute } from "@/components/CircleFeedRoute"
import { PostDetailRoute } from "@/components/PostDetailRoute"
import { ExplorePage } from "@/components/ExplorePage"
import { JoinBanner } from "@/components/JoinBanner"
import { PublicSidebar } from "@/components/PublicSidebar"
import { PublicHomeFeed, PublicExplorePage } from "@/components/PublicHomeFeed"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { Circle, CircleRole, Profile as ProfileType } from "@/types"

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <TooltipProvider delayDuration={300}>
          <AppRoutes />
        </TooltipProvider>
      </BrowserRouter>
    </HelmetProvider>
  )
}

function AppRoutes() {
  const { user, loading: authLoading, signIn, signUp, signInWithMagicLink, resetPassword, signOut, leaveAllCircles, deleteAccount } = useAuth()
  const {
    profile,
    loading: profileLoading,
    needsSetup,
    updateProfile,
  } = useProfile(user?.id)
  const {
    circles,
    circleRoles,
    loading: circlesLoading,
    createCircle,
    joinCircle,
    leaveCircle,
    updateCircle,
    uploadCircleAvatar,
    deleteCircle,
  } = useCircles(user?.id)
  const { allCircles, loading: allCirclesLoading, refetch: refetchAllCircles } = useAllCircles()
  const { adminCircles, refetch: refetchAdminCircles } = useAdminCircles(user?.id)
  const { unreadCount } = useNotifications(user?.id)
  const navigate = useNavigate()
  const location = useLocation()
  const [loadingStuck, setLoadingStuck] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoadingStuck(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  // Auth loading
  if (authLoading || (user && profileLoading)) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-quiet-muted">Loading...</p>
          {loadingStuck && (
            <Button
              variant="ghost"
              size="sm"
              className="text-quiet-muted"
              onClick={() => {
                supabase.auth.signOut()
                window.location.reload()
              }}
            >
              Taking too long? Sign out
            </Button>
          )}
        </div>
      </Shell>
    )
  }

  // Not signed in
  if (!user) {
    const goToLogin = () => navigate("/login")

    // About page — keep its own Shell layout
    if (showAbout || location.pathname === "/about") {
      return (
        <Shell
          wide
          leading={
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setShowAbout(false); navigate("/") }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        >
          <AboutPage onJoin={() => { setShowAbout(false); navigate("/login") }} />
        </Shell>
      )
    }

    // Login page (and any unrecognised path) — show auth form
    const isPublicBrowsingPath =
      location.pathname === "/" ||
      location.pathname === "/explore" ||
      location.pathname.match(/^\/p\//) ||
      location.pathname.match(/^\/[^/]+\/p\//) ||
      (location.pathname.match(/^\/[^/]+$/) && !location.pathname.startsWith("/login"))

    if (!isPublicBrowsingPath) {
      return (
        <div className="min-h-screen bg-quiet-offwhite">
          <div className="md:hidden">
            <img src="/images/landscape_with_boats.jpg" alt="Quiet neighborhood" className="h-48 w-full object-cover" />
            <div className="px-6 py-8">
              <AuthForm onSignIn={signIn} onSignUp={signUp} onMagicLink={signInWithMagicLink} onForgotPassword={resetPassword} />
              <button onClick={() => setShowAbout(true)} className="mt-8 w-full text-center text-xs text-quiet-muted hover:text-quiet-accent transition-colors">
                Learn more about Quiet Network
              </button>
            </div>
          </div>
          <div className="hidden md:flex md:min-h-screen">
            <div className="relative w-1/2">
              <img src="/images/landscape_with_boats.jpg" alt="Quiet neighborhood" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="flex w-1/2 items-center justify-center px-12">
              <div className="w-full max-w-sm">
                <AuthForm onSignIn={signIn} onSignUp={signUp} onMagicLink={signInWithMagicLink} onForgotPassword={resetPassword} />
                <button onClick={() => setShowAbout(true)} className="mt-8 w-full text-center text-xs text-quiet-muted hover:text-quiet-accent transition-colors">
                  Learn more about Quiet Network
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Public browsing — sidebar layout with join banner
    return (
      <PublicLayout circles={allCircles} onSignIn={goToLogin}>
        <Routes>
          <Route path="/" element={<PublicHomeFeed circles={allCircles} />} />
          <Route path="/explore" element={<PublicExplorePage circles={allCircles} loading={allCirclesLoading} />} />
          <Route path="/p/:postId" element={<PostDetailRoute />} />
          <Route path="/:circleSlug/p/:postId" element={<PostDetailRoute />} />
          <Route path="/:circleSlug" element={<PublicCircleFeedRoute onSignIn={goToLogin} />} />
        </Routes>
      </PublicLayout>
    )
  }

  // Profile failed to load
  if (!profile) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-quiet-muted">
            Something went wrong loading your profile.
          </p>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </Shell>
    )
  }

  // Profile setup needed
  if (needsSetup) {
    return (
      <Shell>
        <ProfileSetup
          onComplete={async (updates) => {
            const { error } = await updateProfile(updates)
            if (error) throw error
          }}
        />
      </Shell>
    )
  }

  return (
    <AppLayout profile={profile} circles={circles} adminCircles={adminCircles} unreadCount={unreadCount}>
      <Routes>
        <Route
          path="/"
          element={
            circlesLoading
              ? <p className="mt-6 text-center text-sm text-quiet-muted">Loading...</p>
              : circles.length === 0
                ? <Navigate to="/explore" replace />
                : <HomeFeed circles={circles} userId={user.id} circleRoles={circleRoles} />
          }
        />
        <Route
          path="/explore"
          element={
            <ExplorePage
              circles={circles}
              discoverableCircles={allCircles.filter(
                (ac) => !circles.some((c) => c.id === ac.id)
              )}
              userCountry={profile?.country ?? null}
              loading={circlesLoading || allCirclesLoading}
              onSelect={(circle) => navigate(`/${circle.slug}`)}
              onCreate={async (name, desc) => {
                const { data } = await createCircle(name, desc, profile?.country ?? null)
                if (data) {
                  refetchAllCircles()
                  refetchAdminCircles()
                  navigate(`/${(data as Circle).slug}`)
                }
              }}
              onJoin={async (circle) => {
                await joinCircle(circle.id)
                refetchAllCircles()
                navigate(`/${circle.slug}`)
              }}
              onSetLocation={() => navigate("/profile?edit=1")}
            />
          }
        />
        <Route
          path="/profile"
          element={
            <ProfilePage
              profile={profile}
              defaultEditing={location.search.includes("edit=1")}
              onSave={async (updates) => {
                const { error } = await updateProfile(updates)
                if (error) throw error
              }}
              onSignOut={signOut}
              onAbout={() => navigate("/about")}
              onNotificationSettings={() => navigate("/settings/notifications")}
              onLeaveAllCircles={leaveAllCircles}
              onDeleteAccount={deleteAccount}
            />
          }
        />
        <Route path="/about" element={<AboutPage />} />
        <Route
          path="/notifications"
          element={<NotificationsPage userId={user.id} />}
        />
        <Route
          path="/settings/notifications"
          element={
            <NotificationSettingsPage
              userId={user.id}
              onBack={() => navigate("/profile")}
            />
          }
        />
        <Route path="/user/:username" element={<PublicProfileRoute />} />
        <Route
          path="/p/:postId"
          element={
            <PostDetailRoute
              userId={user.id}
              memberCircleIds={circles.map((c) => c.id)}
              circleRoles={circleRoles}
              onJoinClick={() => navigate("/")}
            />
          }
        />
        <Route
          path="/:circleSlug/p/:postId"
          element={
            <PostDetailRoute
              userId={user.id}
              memberCircleIds={circles.map((c) => c.id)}
              circleRoles={circleRoles}
              onJoinClick={() => navigate("/")}
            />
          }
        />
        <Route
          path="/admin/:circleSlug"
          element={
            <AdminPanel
              userId={user.id}
              adminCircles={adminCircles}
              updateCircle={async (circleId, updates) => {
                const result = await updateCircle(circleId, updates)
                await Promise.all([refetchAllCircles(), refetchAdminCircles()])
                return result
              }}
              uploadCircleAvatar={uploadCircleAvatar}
              deleteCircle={deleteCircle}
            />
          }
        />
        <Route
          path="/:circleSlug"
          element={
            <CircleFeedRoute
              userId={user.id}
              circles={circles}
              memberCircleIds={circles.map((c) => c.id)}
              circleRoles={circleRoles}
              joinCircle={joinCircle}
              leaveCircle={leaveCircle}
              updateCircle={updateCircle}
              uploadCircleAvatar={uploadCircleAvatar}
            />
          }
        />
      </Routes>
      <BottomNav avatar={profile.avatar_emoji} unreadCount={unreadCount} />
    </AppLayout>
  )
}

// ─── Public layout (unauthenticated, with sidebar) ───

function PublicLayout({
  circles,
  onSignIn,
  children,
}: {
  circles: Circle[]
  onSignIn: () => void
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-quiet-offwhite">
      <PublicSidebar circles={circles} onSignIn={onSignIn} />
      <div className="md:ml-60 lg:ml-64">
        <JoinBanner onJoin={onSignIn} />
        <main className="mx-auto max-w-3xl px-4 pb-20 pt-6 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}

// ─── App layout with sidebar ─────────────────────────

function AppLayout({
  profile,
  circles,
  adminCircles = [],
  unreadCount = 0,
  children,
}: {
  profile: ProfileType
  circles: Circle[]
  adminCircles?: (Circle & { role: CircleRole })[]
  unreadCount?: number
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-quiet-offwhite">
      <MobileMenu profile={profile} circles={circles} adminCircles={adminCircles} />
      <Sidebar profile={profile} circles={circles} adminCircles={adminCircles} unreadCount={unreadCount} />
      <div className="md:ml-60 lg:ml-64">
        <main className="mx-auto max-w-3xl px-4 pb-20 pt-14 md:pb-8 md:pt-8">
          {children}
        </main>
      </div>
    </div>
  )
}

// ─── Public profile route ────────────────────────────

function PublicProfileRoute() {
  const { username } = useParams<{ username: string }>()
  const { profile, loading } = usePublicProfile(username)
  const { posts, loading: postsLoading } = useUserPosts(
    profile?.posts_public !== false ? profile?.id : undefined
  )
  const navigate = useNavigate()

  if (loading) {
    return <p className="text-center text-sm text-quiet-muted">Loading...</p>
  }

  if (!profile) {
    return (
      <div>
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="mt-4 text-center text-sm text-quiet-muted">User not found.</p>
      </div>
    )
  }

  return <PublicProfilePage profile={profile} posts={posts} postsLoading={postsLoading} />
}

export default App
