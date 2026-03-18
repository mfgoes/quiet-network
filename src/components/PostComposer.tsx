import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { Lightbulb, Send, Tag, Bold, Italic, Underline, List, Smile, Link2, Heading2, Image, X } from "lucide-react"
import { toast } from "sonner"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import imageCompression from "browser-image-compression"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { DURATION_OPTIONS, POST_SPARKS } from "@/types"
import type { CircleTag } from "@/types"
import { supabase } from "@/lib/supabase"

const VIDEO_RE = /\.(mp4|webm|mov|ogg)(\?.*)?$/i

/** Returns true for URLs that will render as rich embeds. */
function isEmbedableUrl(url: string): boolean {
  if (VIDEO_RE.test(url)) return true
  if (/imgur\.com/.test(url) && url.endsWith(".gifv")) return true
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, "")
    if (host === "youtube.com" && u.pathname.startsWith("/watch")) return true
    if (host === "youtu.be") return true
    if ((host === "x.com" || host === "twitter.com") && /\/[^/]+\/status\/\d+/.test(u.pathname)) return true
    if (host === "bsky.app" && /\/profile\/[^/]+\/post\//.test(u.pathname)) return true
    if ((host === "reddit.com" || host === "old.reddit.com") && /\/r\/[^/]+\/comments\//.test(u.pathname)) return true
    if (host === "instagram.com" && /\/(p|reel|tv)\//.test(u.pathname)) return true
  } catch { /* ignore */ }
  return false
}

/** Finds the first bare (non-markdown-link) embedable URL in text. */
function detectFirstEmbedUrl(text: string): string | null {
  const bareRegex = /(?<!\]\()https?:\/\/[^\s)<]+/g
  let match
  while ((match = bareRegex.exec(text)) !== null) {
    if (isEmbedableUrl(match[0])) return match[0]
  }
  return null
}

function platformLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "")
    if (host === "youtube.com" || host === "youtu.be") return "YouTube"
    if (host === "x.com" || host === "twitter.com") return "X / Twitter"
    if (host === "bsky.app") return "Bluesky"
    if (host === "reddit.com" || host === "old.reddit.com") return "Reddit"
    if (host === "instagram.com") return "Instagram"
    return host
  } catch { return "link" }
}

interface PostComposerProps {
  onSubmit: (content: string, durationSeconds: number, tags: string[], imageUrl?: string | null) => Promise<unknown>
  defaultPermanent?: boolean
  circleTags?: CircleTag[]
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

export function PostComposer({ onSubmit, defaultPermanent, circleTags }: PostComposerProps) {
  const activeTags = (circleTags ?? []).map(t => ({ id: t.id, label: `#${t.name}`, color: t.color }))
  const [text, setText] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [durationIndex, setDurationIndex] = useState(() => defaultPermanent ? DURATION_OPTIONS.length - 1 : 0)
  const [sparkIndex, setSparkIndex] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showTags, setShowTags] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [linkText, setLinkText] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [embedEnabled, setEmbedEnabled] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const detectedEmbedUrl = useMemo(() => detectFirstEmbedUrl(text), [text])
  const prevEmbedUrlRef = useRef<string | null>(null)

  // Reset embed toggle when a new embedable URL is detected
  useEffect(() => {
    if (detectedEmbedUrl !== prevEmbedUrlRef.current) {
      prevEmbedUrlRef.current = detectedEmbedUrl
      if (detectedEmbedUrl) setEmbedEnabled(true)
    }
  }, [detectedEmbedUrl])

  const handleEmbedToggle = useCallback(() => {
    if (!detectedEmbedUrl) return
    const domain = (() => { try { return new URL(detectedEmbedUrl).hostname.replace(/^www\./, "") } catch { return detectedEmbedUrl } })()
    setText((prev) => prev.replace(detectedEmbedUrl, `[${domain}](${detectedEmbedUrl})`))
  }, [detectedEmbedUrl])
  const emojiRef = useRef<HTMLDivElement>(null)
  const linkRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image (JPEG, PNG, WebP, or GIF)")
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error("Image must be under 5MB")
      return
    }

    setUploadingImage(true)
    try {
      // Store original file type and name
      const originalType = file.type
      const originalName = file.name

      console.log("Original file:", { type: originalType, size: file.size, name: originalName })

      let finalFile: File

      // Skip compression if file is already small enough
      if (file.size <= 1024 * 1024) { // 1MB
        console.log("File already small, skipping compression")
        finalFile = file
      } else {
        // Compress image
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: false,
        }
        const compressedBlob = await imageCompression(file, options)

        console.log("Compressed blob:", { type: compressedBlob.type, size: compressedBlob.size })

        // Create File object with correct MIME type
        finalFile = new File([compressedBlob], originalName, {
          type: originalType, // Force the original MIME type
        })

        console.log("Final file:", { type: finalFile.type, size: finalFile.size })
      }

      setSelectedImage(finalFile)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(finalFile)

      toast.success("Image ready to upload")
    } catch (error) {
      console.error("Image compression error:", error)
      toast.error("Failed to process image")
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!selectedImage) return null

    try {
      const fileExt = selectedImage.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from("post-images")
        .upload(fileName, selectedImage, {
          cacheControl: "3600",
          upsert: false,
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from("post-images")
        .getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error("Image upload error:", error)
      throw error
    }
  }

  const handleSubmit = async () => {
    if (!text.trim() && !selectedImage) return
    setSubmitting(true)
    try {
      let imageUrl: string | null = null

      if (selectedImage) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error("You must be logged in to upload images")
          return
        }
        imageUrl = await uploadImage(user.id)
      }

      const error = await onSubmit(text, selectedDuration.seconds, selectedTags, imageUrl)
      if (error) {
        toast.error("Couldn't share your post. Please try again.")
      } else {
        setText("")
        setSelectedTags([])
        setShowTags(false)
        setShowEmoji(false)
        setShowLink(false)
        removeImage()
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

  const showFull = isActive || !!text || !!selectedImage

  return (
    <div
      ref={containerRef}
      className="rounded-lg border border-quiet-border bg-white p-4 shadow-sm"
      onBlur={(e) => {
        if (!text && !selectedImage && !containerRef.current?.contains(e.relatedTarget as Node)) {
          setIsActive(false)
        }
      }}
    >
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsActive(true)}
          onBlur={undefined}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Start a circle post..."
          rows={showFull ? 3 : 1}
          className="w-full resize-none rounded-md border border-quiet-border bg-quiet-offwhite p-3 pr-10 text-sm text-quiet-slate placeholder:text-quiet-muted focus:border-quiet-accent focus:outline-none transition-all"
        />
        {showFull && (
          <button
            type="button"
            onClick={cycleSpark}
            className="absolute right-2 top-2 rounded-md p-1.5 text-quiet-muted transition-colors hover:bg-quiet-border hover:text-quiet-slate"
            title="Get a post spark"
          >
            <Lightbulb className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Formatting toolbar */}
      {showFull && <div className="mt-2 flex items-center gap-1">
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
            // Insert "## " at the start of the current line
            const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1
            const before = value.slice(0, lineStart)
            const after = value.slice(lineStart)
            if (after.match(/^#+\s/)) return // already a heading
            const newValue = `${before}## ${after}`
            setText(newValue)
            requestAnimationFrame(() => {
              ta.focus()
              const cursor = selectionStart + 3
              ta.setSelectionRange(cursor, cursor)
            })
          }}
          className={toolbarBtn}
          title="Heading (## Heading)"
        >
          <Heading2 className="h-4 w-4" />
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

        {/* Image upload button */}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage || !!selectedImage}
            className={`rounded p-1.5 transition-colors ${
              selectedImage
                ? "bg-quiet-accent text-white"
                : uploadingImage
                ? "text-quiet-muted/50 cursor-not-allowed"
                : "text-quiet-muted hover:bg-quiet-border/50 hover:text-quiet-slate"
            }`}
            title="Add image"
          >
            <Image className="h-4 w-4" />
          </button>
        </div>

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
      </div>}

      {/* Embed toggle — shown when a social/media URL is detected */}
      {showFull && detectedEmbedUrl && (
        <div className="mt-2 flex items-center gap-2">
          <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-quiet-muted">
            <input
              type="checkbox"
              checked={embedEnabled}
              onChange={(e) => {
                setEmbedEnabled(e.target.checked)
                if (!e.target.checked) handleEmbedToggle()
              }}
              className="h-3 w-3 accent-quiet-accent"
            />
            <span>Embed {platformLabel(detectedEmbedUrl)}</span>
          </label>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="mt-3 relative inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-h-48 rounded-lg border border-quiet-border object-cover"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 rounded-full bg-quiet-slate p-1 text-white shadow-lg transition-colors hover:bg-quiet-accent"
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showFull && <>
        {/* Selected tags */}
        {selectedTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedTags.map((tagId) => {
              const tag = activeTags.find((t) => t.id === tagId)
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
              {activeTags.map((tag) => {
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
              max={DURATION_OPTIONS.length - 1}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-quiet-muted">∞</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          {activeTags.length > 0 && (
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
          )}
          <Button
            onClick={handleSubmit}
            disabled={(!text.trim() && !selectedImage) || submitting}
            size="sm"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {submitting ? "Sharing..." : "Share quietly"}
          </Button>
        </div>
      </>}
    </div>
  )
}
