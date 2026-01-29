import { useState, useCallback } from "react"
import { Lightbulb, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { DURATION_OPTIONS, POST_SPARKS } from "@/types"

interface PostComposerProps {
  onSubmit: (content: string, durationSeconds: number) => void
}

export function PostComposer({ onSubmit }: PostComposerProps) {
  const [content, setContent] = useState("")
  const [durationIndex, setDurationIndex] = useState(0)
  const [sparkIndex, setSparkIndex] = useState(0)

  const selectedDuration = DURATION_OPTIONS[durationIndex]

  const cycleSpark = useCallback(() => {
    const next = (sparkIndex + 1) % POST_SPARKS.length
    setSparkIndex(next)
    setContent(POST_SPARKS[next])
  }, [sparkIndex])

  const handleSubmit = () => {
    const trimmed = content.trim()
    if (!trimmed) return
    onSubmit(trimmed, selectedDuration.seconds)
    setContent("")
  }

  return (
    <div className="rounded-lg border border-quiet-border bg-white p-4 shadow-sm">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share something with your neighbors..."
          rows={3}
          className="w-full resize-none rounded-md border border-quiet-border bg-quiet-offwhite p-3 text-quiet-slate placeholder:text-quiet-muted focus:border-quiet-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={cycleSpark}
          className="absolute right-2 top-2 rounded-md p-1.5 text-quiet-muted transition-colors hover:bg-quiet-border hover:text-quiet-slate"
          title="Get a post spark"
        >
          <Lightbulb className="h-4 w-4" />
        </button>
      </div>

      {/* Duration Slider */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-quiet-muted">Fades after</span>
          <span className="font-medium text-quiet-slate">
            {selectedDuration.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-quiet-muted">48h</span>
          <Slider
            value={[durationIndex]}
            onValueChange={(v) => setDurationIndex(v[0])}
            max={2}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-quiet-muted">30d</span>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!content.trim()}
          size="sm"
        >
          <Send className="mr-1.5 h-3.5 w-3.5" />
          Share quietly
        </Button>
      </div>
    </div>
  )
}
