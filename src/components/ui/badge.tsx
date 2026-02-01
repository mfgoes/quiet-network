import { type HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-quiet-border text-quiet-accent",
        expiring: "bg-amber-50 text-quiet-warm",
        pinned: "bg-quiet-border text-quiet-muted",
        admin: "bg-amber-100 text-amber-800",
        moderator: "bg-blue-100 text-blue-800",
        member: "bg-quiet-border text-quiet-muted",
        bot: "bg-quiet-border text-quiet-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
