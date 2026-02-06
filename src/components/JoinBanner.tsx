import { Button } from "@/components/ui/button"

interface JoinBannerProps {
  onJoin: () => void
}

export function JoinBanner({ onJoin }: JoinBannerProps) {
  return (
    <div className="sticky top-0 z-50 border-b border-quiet-border bg-gradient-to-r from-[#EDE9FE] to-[#DBEAFE] px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-quiet-slate">
            Join Quiet Network to post, comment, and connect with your community
          </p>
        </div>
        <Button
          onClick={onJoin}
          size="sm"
          className="flex-shrink-0 bg-quiet-slate text-white hover:bg-quiet-accent"
        >
          Sign up
        </Button>
      </div>
    </div>
  )
}
