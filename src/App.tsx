import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { avatarUrl } from "@/types"
import { useAuth, useProfile, useCircles, usePosts } from "@/lib/hooks"
import { AuthForm } from "@/components/AuthForm"
import { ProfileSetup } from "@/components/ProfileSetup"
import { ProfilePage } from "@/components/ProfilePage"
import { CirclePicker } from "@/components/CirclePicker"
import { PostComposer } from "@/components/PostComposer"
import { PostCard } from "@/components/PostCard"
import { CircleAbout } from "@/components/CircleAbout"
import { AboutPage } from "@/components/AboutPage"
import { BottomNav, type View } from "@/components/BottomNav"
import { Button } from "@/components/ui/button"
import type { Circle } from "@/types"

function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth()
  const {
    profile,
    loading: profileLoading,
    needsSetup,
    updateProfile,
  } = useProfile(user?.id)
  const {
    circles,
    loading: circlesLoading,
    createCircle,
    updateCircle,
  } = useCircles(user?.id)
  const [activeCircle, setActiveCircle] = useState<Circle | null>(null)
  const [view, setView] = useState<View>("circles")
  const [showAbout, setShowAbout] = useState(false)

  const handleNavigate = (v: View) => {
    if (v === "circles") setActiveCircle(null)
    setView(v)
  }

  // Auth loading
  if (authLoading || (user && profileLoading)) {
    return (
      <Shell>
        <p className="text-center text-sm text-quiet-muted">Loading...</p>
      </Shell>
    )
  }

  // Not signed in
  if (!user) {
    return (
      <Shell>
        <AuthForm onSignIn={signIn} onSignUp={signUp} />
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

  // About page
  if (showAbout) {
    return (
      <Shell
        leading={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAbout(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      >
        <AboutPage />
      </Shell>
    )
  }

  // Profile page
  if (view === "profile") {
    return (
      <Shell
        leading={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView(activeCircle ? "feed" : "circles")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      >
        <ProfilePage
          profile={profile!}
          onSave={async (updates) => {
            const { error } = await updateProfile(updates)
            if (error) throw error
          }}
          onSignOut={signOut}
          onAbout={() => setShowAbout(true)}
        />
        <BottomNav
          view={view}
          onNavigate={handleNavigate}
          avatar={profile!.avatar_emoji}
          hasActiveCircle={!!activeCircle}
        />
      </Shell>
    )
  }

  // Circle picker
  if (!activeCircle || view === "circles") {
    return (
      <Shell
        trailing={
          <AvatarButton
            avatar={profile!.avatar_emoji}
            onClick={() => setView("profile")}
          />
        }
      >
        <CirclePicker
          circles={circles}
          loading={circlesLoading}
          onSelect={(circle) => {
            setActiveCircle(circle)
            setView("feed")
          }}
          onCreate={async (name, desc) => {
            const { data } = await createCircle(name, desc)
            if (data) {
              setActiveCircle(data as Circle)
              setView("feed")
            }
          }}
        />
        <BottomNav
          view="circles"
          onNavigate={handleNavigate}
          avatar={profile!.avatar_emoji}
          hasActiveCircle={!!activeCircle}
        />
      </Shell>
    )
  }

  // Circle feed
  return (
    <Shell
      wide
      subtitle={activeCircle.name}
      leading={
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setActiveCircle(null)
            setView("circles")
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      }
      trailing={
        <AvatarButton
          avatar={profile!.avatar_emoji}
          onClick={() => setView("profile")}
        />
      }
    >
      <CircleFeed
        circle={activeCircle}
        userId={user.id}
        onUpdateCircle={async (updates) => {
          const { data } = await updateCircle(activeCircle.id, updates)
          if (data) setActiveCircle(data as Circle)
        }}
      />
      <BottomNav
        view="feed"
        onNavigate={handleNavigate}
        avatar={profile!.avatar_emoji}
        hasActiveCircle
      />
    </Shell>
  )
}

// ─── Avatar button (desktop only, top-right) ────────

function AvatarButton({
  avatar,
  onClick,
}: {
  avatar: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="hidden h-9 w-9 items-center justify-center rounded-full overflow-hidden transition-all hover:ring-2 hover:ring-quiet-accent md:flex"
      aria-label="Open profile"
    >
      <img
        src={avatarUrl(avatar)}
        alt="profile"
        className="h-full w-full object-cover"
      />
    </button>
  )
}

// ─── Feed (extracted so the hook only runs when a circle is active) ──

function CircleFeed({
  circle,
  userId,
  onUpdateCircle,
}: {
  circle: Circle
  userId: string
  onUpdateCircle: (updates: { about?: string | null; rules?: string | null }) => Promise<void>
}) {
  const circleId = circle.id
  const { posts, loading, createPost } = usePosts(circleId)

  const handleNewPost = async (content: string, durationSeconds: number) => {
    await createPost(content, durationSeconds, userId)
  }

  return (
    <>
      {/* Mobile: collapsible above feed */}
      <div className="lg:hidden">
        <CircleAbout circle={circle} userId={userId} onUpdate={onUpdateCircle} />
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6">
        {/* Main feed column */}
        <div>
          <PostComposer onSubmit={handleNewPost} />

          {loading ? (
            <p className="mt-6 text-center text-sm text-quiet-muted">
              Loading posts...
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* Desktop: sidebar */}
        <div className="hidden lg:block">
          <CircleAbout sidebar circle={circle} userId={userId} onUpdate={onUpdateCircle} />
        </div>
      </div>
    </>
  )
}

// ─── Layout shell ────────────────────────────────────

function Shell({
  children,
  subtitle,
  leading,
  trailing,
  wide,
}: {
  children: React.ReactNode
  subtitle?: string
  leading?: React.ReactNode
  trailing?: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className={`mx-auto min-h-screen bg-quiet-offwhite px-4 pb-20 pt-8 md:pb-8 ${wide ? "max-w-4xl" : "max-w-xl"}`}>
      <header className="mb-8 flex items-center justify-between">
        <div className="w-9">{leading}</div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-quiet-slate">
            Quiet Network
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-quiet-muted">{subtitle}</p>
          ) : (
            <p className="mt-0.5 text-sm text-quiet-muted">
              Your neighborhood, without the noise
            </p>
          )}
        </div>
        <div className="w-9">{trailing}</div>
      </header>
      {children}
    </div>
  )
}

export default App
