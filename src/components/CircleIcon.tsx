import { circleColor, circleInitial } from "@/types"

interface CircleIconProps {
  name: string
  avatarUrl?: string | null
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  xs: "h-4 w-4 text-[9px]",
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
}

export function CircleIcon({ name, avatarUrl, size = "md", className = "" }: CircleIconProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses[size]} shrink-0 rounded-full object-cover ${className}`}
      />
    )
  }

  const color = circleColor(name)

  return (
    <span
      className={`${sizeClasses[size]} inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${className}`}
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {circleInitial(name)}
    </span>
  )
}
