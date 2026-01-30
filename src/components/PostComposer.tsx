import { useState, useCallback } from "react"
import { Lightbulb, Send, Tag } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { DURATION_OPTIONS, POST_SPARKS, TAGS } from "@/types"

interface PostComposerProps {
  onSubmit: (content: string, durationSeconds: number, tags: string[]) => Promise<unknown>
}

export function PostComposer({ onSubmit }: PostComposerProps) {
  const [content, setContent] = useState("")
  const [durationIndex, setDurationIndex] = useState(0)
  const [sparkIndex, setSparkIndex] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showTags, setShowTags] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const selectedDuration = DURATION_OPTIONS[durationIndex]

  const cycleSpark = useCallback(() => {
    const next = (sparkIndex + 1) % POST_SPARKS.length
    setSparkIndex(next)
    setContent(POST_SPARKS[next])
  }, [sparkIndex])

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId)) return prev.filter((t) => t !== tagId)
      if (prev.length >= 3) return prev
      return [...prev, tagId]
    })
  }

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      const error = await onSubmit(trimmed, selectedDuration.seconds, selectedTags)
      if (error) {
        toast.error("Couldn't share your post. Please try again.")
      } else {
        setContent("")
        setSelectedTags([])
        setShowTags(false)
        toast.success("Shared quietly.")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
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

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedTags.map((tagId) => {
            const tag = TAGS.find((t) => t.id === tagId)
            if (!tag) return null
            return (
              <button
                key={tagId}
                type="button"
                onClick={() => toggleTag(tagId)}
                className="rounded-full px-2.5 py-0.5 text-xs text-quiet-slate transition-opacity hover:opacity-70"
                style={{ backgroundColor: tag.color }}
              >
                {tag.label} &times;
              </button>
            )
          })}
        </div>
      )}

      {/* Tag picker */}
      {showTags && (
        <div className="mt-3 rounded-md border border-quiet-border bg-quiet-offwhite p-3">
          <p className="mb-2 text-xs text-quiet-muted">
            Add tags (max 3)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag.id)
              const isDisabled = !isSelected && selectedTags.length >= 3
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  disabled={isDisabled}
                  className={`rounded-full px-2.5 py-0.5 text-xs transition-all ${
                    isSelected
                      ? "text-quiet-slate ring-1 ring-quiet-accent"
                      : isDisabled
                        ? "text-quiet-muted/50 opacity-50 cursor-not-allowed"
                        : "text-quiet-slate hover:ring-1 hover:ring-quiet-border"
                  }`}
                  style={{ backgroundColor: isSelected ? tag.color : `${tag.color}80` }}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

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

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowTags(!showTags)}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
            showTags || selectedTags.length > 0
              ? "text-quiet-slate bg-quiet-border/50"
              : "text-quiet-muted hover:text-quiet-slate hover:bg-quiet-border/50"
          }`}
        >
          <Tag className="h-3.5 w-3.5" />
          Tags
        </button>
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          size="sm"
        >
          <Send className="mr-1.5 h-3.5 w-3.5" />
          Share quietly
        </Button>
      </div>
    </div>
  )
}
