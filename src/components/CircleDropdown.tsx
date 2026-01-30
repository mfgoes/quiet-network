import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { Circle } from "@/types"

interface CircleDropdownProps {
  circles: Circle[]
  selectedSlug?: string
}

export function CircleDropdown({ circles, selectedSlug }: CircleDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const selected = selectedSlug
    ? circles.find((c) => c.slug === selectedSlug)
    : null

  const label = selected ? selected.name : "All circles"

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-lg font-semibold text-quiet-slate hover:text-quiet-accent transition-colors"
      >
        {label}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] rounded-lg border border-quiet-border bg-white shadow-lg py-1">
          <button
            onClick={() => {
              navigate("/")
              setOpen(false)
            }}
            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
              !selectedSlug
                ? "bg-quiet-aged text-quiet-slate font-medium"
                : "text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate"
            }`}
          >
            All circles
          </button>
          {circles.map((circle) => (
            <button
              key={circle.id}
              onClick={() => {
                navigate(`/${circle.slug}`)
                setOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                selectedSlug === circle.slug
                  ? "bg-quiet-aged text-quiet-slate font-medium"
                  : "text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate"
              }`}
            >
              {circle.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
