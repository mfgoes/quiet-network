import { circleColor, circleInitial } from "@/types"

interface CircleIconProps {
  name: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
}

export function CircleIcon({ name, size = "md", className = "" }: CircleIconProps) {
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
