import { useState, useCallback, useRef, useEffect } from "react"
import { Lightbulb, Send, Tag, Bold, Italic, Underline, List, Smile, Link2 } from "lucide-react"
import { toast } from "sonner"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { DURATION_OPTIONS, POST_SPARKS, TAGS } from "@/types"

interface PostComposerProps {
  onSubmit: (content: string, durationSeconds: number, tags: string[]) => Promise<unknown>
}

/**
 * Wrap selected text in a textarea with the given prefix/suffix markers.
 * If nothing is selected, insert markers and place cursor between them.
 */
function wrapSelection(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix: string,
  setText: (v: string) => void,
) {
  const { selectionStart, selectionEnd, value } = textarea
  const selected = value.slice(selectionStart, selectionEnd)
  const before = value.slice(0, selectionStart)
  const after = value.slice(selectionEnd)

  const newValue = `${before}${prefix}${selected}${suffix}${after}`
  setText(newValue)

  // Restore cursor position after React re-render
  requestAnimationFrame(() => {
    textarea.focus()
    if (selected) {
      textarea.setSelectionRange(
        selectionStart + prefix.length,
        selectionEnd + prefix.length,
      )
    } else {
      const cursor = selectionStart + prefix.length
      textarea.setSelectionRange(cursor, cursor)
    }
  })
}

export function PostComposer({ onSubmit }: PostComposerProps) {
  const [text, setText] = useState("")
  const [durationIndex, setDurationIndex] = useState(0)
  const [sparkIndex, setSparkIndex] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showTags, setShowTags] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [linkText, setLinkText] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const linkRef = useRef<HTMLDivElement>(null)

  const selectedDuration = DURATION_OPTIONS[durationIndex]

  const cycleSpark = useCallback(() => {
    const next = (sparkIndex + 1) % POST_SPARKS.length
    setSparkIndex(next)
    setText(POST_SPARKS[next])
    requestAnimationFrame(() => textareaRef.current?.focus())
  }, [sparkIndex])

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId)) return prev.filter((t) => t !== tagId)
      if (prev.length >= 3) return prev
      return [...prev, tagId]
    })
  }

  const handleSubmit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const error = await onSubmit(text, selectedDuration.seconds, selectedTags)
      if (error) {
        toast.error("Couldn't share your post. Please try again.")
      } else {
        setText("")
        setSelectedTags([])
        setShowTags(false)
        setShowEmoji(false)
        setShowLink(false)
        toast.success("Shared quietly.")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const onEmojiSelect = (emoji: { native: string }) => {
    const ta = textareaRef.current
    if (ta) {
      const { selectionStart, value } = ta
      const newValue = value.slice(0, selectionStart) + emoji.native + value.slice(selectionStart)
      setText(newValue)
      requestAnimationFrame(() => {
        ta.focus()
        const cursor = selectionStart + emoji.native.length
        ta.setSelectionRange(cursor, cursor)
      })
    } else {
      setText((prev) => prev + emoji.native)
    }
    setShowEmoji(false)
  }

  const insertLink = () => {
    if (!linkUrl.trim()) return
    const label = linkText.trim() || linkUrl.trim()
    const md = `[${label}](${linkUrl.trim()})`
    const ta = textareaRef.current
    if (ta) {
      const { selectionStart, value } = ta
      const newValue = value.slice(0, selectionStart) + md + value.slice(selectionStart)
      setText(newValue)
      requestAnimationFrame(() => {
        ta.focus()
        const cursor = selectionStart + md.length
        ta.setSelectionRange(cursor, cursor)
      })
    } else {
      setText((prev) => prev + md)
    }
    setLinkText("")
    setLinkUrl("")
    setShowLink(false)
  }

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmoji) return
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showEmoji])

  // Close link popover on outside click
  useEffect(() => {
    if (!showLink) return
    const handler = (e: MouseEvent) => {
      if (linkRef.current && !linkRef.current.contains(e.target as Node)) {
        setShowLink(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showLink])

  const toolbarBtn = "rounded p-1.5 transition-colors text-quiet-muted hover:bg-quiet-border/50 hover:text-quiet-slate"

  return (
    <div className="rounded-lg border border-quiet-border bg-white p-4 shadow-sm">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Share something with your neighbors..."
          rows={3}
          className="w-full min-h-[72px] resize-none rounded-md border border-quiet-border bg-quiet-offwhite p-3 pr-10 text-sm text-quiet-slate placeholder:text-quiet-muted focus:border-quiet-accent focus:outline-none"
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

      {/* Formatting toolbar */}
      <div className="mt-2 flex items-center gap-1">
        <button
          type="button"
          onClick={() => textareaRef.current && wrapSelection(textareaRef.current, "**", "**", setText)}
          className={toolbarBtn}
          title="Bold (**text**)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => textareaRef.current && wrapSelection(textareaRef.current, "_", "_", setText)}
          className={toolbarBtn}
          title="Italic (_text_)"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => textareaRef.current && wrapSelection(textareaRef.current, "__", "__", setText)}
          className={toolbarBtn}
          title="Underline (__text__)"
        >
          <Underline className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            const ta = textareaRef.current
            if (!ta) return
            const { selectionStart, value } = ta
            // Insert "- " at the start of the current line
            const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1
            const before = value.slice(0, lineStart)
            const after = value.slice(lineStart)
            if (after.startsWith("- ")) return // already a list item
            const newValue = `${before}- ${after}`
            setText(newValue)
            requestAnimationFrame(() => {
              ta.focus()
              const cursor = selectionStart + 2
              ta.setSelectionRange(cursor, cursor)
            })
          }}
          className={toolbarBtn}
          title="Bullet list (- item)"
        >
          <List className="h-4 w-4" />
        </button>

        {/* Link button + popover */}
        <div className="relative" ref={linkRef}>
          <button
            type="button"
            onClick={() => {
              // Pre-fill link text with selection
              const ta = textareaRef.current
              if (ta) {
                const selected = ta.value.slice(ta.selectionStart, ta.selectionEnd)
                if (selected) setLinkText(selected)
              }
              setShowLink(!showLink)
            }}
            className={`rounded p-1.5 transition-colors ${
              showLink
                ? "bg-quiet-border text-quiet-slate"
                : "text-quiet-muted hover:bg-quiet-border/50 hover:text-quiet-slate"
            }`}
            title="Add link"
          >
            <Link2 className="h-4 w-4" />
          </button>
          {showLink && (
            <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-quiet-border bg-white p-3 shadow-lg space-y-2">
              <input
                type="text"
                placeholder="Link text (optional)"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="w-full rounded-md border border-quiet-border bg-quiet-offwhite px-2.5 py-1.5 text-sm text-quiet-slate placeholder:text-quiet-muted focus:border-quiet-accent focus:outline-none"
              />
              <input
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") insertLink() }}
                className="w-full rounded-md border border-quiet-border bg-quiet-offwhite px-2.5 py-1.5 text-sm text-quiet-slate placeholder:text-quiet-muted focus:border-quiet-accent focus:outline-none"
              />
              <Button
                size="sm"
                onClick={insertLink}
                disabled={!linkUrl.trim()}
                className="w-full"
              >
                Insert link
              </Button>
            </div>
          )}
        </div>

        {/* Emoji button + picker */}
        <div className="relative" ref={emojiRef}>
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className={`rounded p-1.5 transition-colors ${
              showEmoji
                ? "bg-quiet-border text-quiet-slate"
                : "text-quiet-muted hover:bg-quiet-border/50 hover:text-quiet-slate"
            }`}
            title="Emoji"
          >
            <Smile className="h-4 w-4" />
          </button>
          {showEmoji && (
            <div className="absolute left-0 top-full z-50 mt-1">
              <Picker
                data={data}
                onEmojiSelect={onEmojiSelect}
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={2}
              />
            </div>
          )}
        </div>
      </div>

      {/* Formatting hint */}
      <p className="mt-1.5 text-[11px] text-quiet-muted/60">
        **bold**&ensp; _italic_&ensp; __underline__&ensp; [text](url)
      </p>

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
          disabled={!text.trim() || submitting}
          size="sm"
        >
          <Send className="mr-1.5 h-3.5 w-3.5" />
          Share quietly
        </Button>
      </div>
    </div>
  )
}
