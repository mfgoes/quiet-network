'use client'

import { type HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
	"inline-flex items-center rounded-[var(--radius)] border px-1.5 py-0.5 font-mono text-[0.68rem] font-medium uppercase leading-none tracking-[0.08em] tabular-nums",
	{
		variants: {
			variant: {
				default: "border-line text-muted",
				expiring: "border-time/40 text-time",
				pinned: "border-line text-muted",
				permanent: "border-line text-muted",
				admin: "border-accent/40 text-accent",
				moderator: "border-line-strong text-ink",
				member: "border-line text-muted",
				bot: "border-line text-faint",
				notice: "border-accent/40 text-accent",
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
