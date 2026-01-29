import { useState } from "react"
import { LogOut, ArrowLeft } from "lucide-react"
import { useAuth, useCircles, usePosts } from "@/lib/hooks"
import { AuthForm } from "@/components/AuthForm"
import { CirclePicker } from "@/components/CirclePicker"
import { PostComposer } from "@/components/PostComposer"
import { PostCard } from "@/components/PostCard"
import { Button } from "@/components/ui/button"
import type { Circle } from "@/types"

function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth()
  const {
    circles,
    loading: circlesLoading,
    createCircle,
  } = useCircles(user?.id)
  const [activeCircle, setActiveCircle] = useState<Circle | null>(null)

  // Auth loading
  if (authLoading) {
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

  // Signed in but no circle selected
  if (!activeCircle) {
    return (
      <Shell
        trailing={
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        }
      >
        <CirclePicker
          circles={circles}
          loading={circlesLoading}
          onSelect={setActiveCircle}
          onCreate={async (name, desc) => {
            const { data } = await createCircle(name, desc)
            if (data) setActiveCircle(data as Circle)
          }}
        />
      </Shell>
    )
  }

  // Circle feed
  return (
    <Shell
      subtitle={activeCircle.name}
      leading={
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setActiveCircle(null)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      }
      trailing={
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      }
    >
      <CircleFeed circleId={activeCircle.id} userId={user.id} />
    </Shell>
  )
}

// ─── Feed (extracted so the hook only runs when a circle is active) ──

function CircleFeed({
  circleId,
  userId,
}: {
  circleId: string
  userId: string
}) {
  const { posts, loading, createPost } = usePosts(circleId)

  const handleNewPost = async (content: string, durationSeconds: number) => {
    await createPost(content, durationSeconds, userId)
  }

  return (
    <>
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
    </>
  )
}

// ─── Layout shell ────────────────────────────────────

function Shell({
  children,
  subtitle,
  leading,
  trailing,
}: {
  children: React.ReactNode
  subtitle?: string
  leading?: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <div className="mx-auto min-h-screen max-w-xl bg-quiet-offwhite px-4 py-8">
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
