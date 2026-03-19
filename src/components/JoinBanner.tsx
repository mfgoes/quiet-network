interface JoinBannerProps {
  onJoin: () => void
}

export function JoinBanner({ onJoin }: JoinBannerProps) {
  return (
    <div className="border-b border-quiet-border bg-quiet-offwhite px-4 py-2">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <p className="text-xs text-quiet-muted">
          Join to post, comment, and connect
        </p>
        <button
          onClick={onJoin}
          className="flex-shrink-0 text-xs text-quiet-accent hover:underline"
        >
          Sign up
        </button>
      </div>
    </div>
  )
}
