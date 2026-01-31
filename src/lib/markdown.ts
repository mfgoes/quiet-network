/**
 * Lightweight markdown-to-HTML parser for Quiet Network posts.
 *
 * Supported syntax:
 *   **bold**      → <strong>bold</strong>
 *   _italic_      → <em>italic</em>
 *   __underline__ → <u>underline</u>
 *   [text](url)   → <a href="url">text</a>
 *   - list item   → <li>list item</li>  (wrapped in <ul>)
 *   bare URLs     → <a href="url">url</a>
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function parseInline(line: string): string {
  let result = escapeHtml(line)

  // Links: [text](url)
  result = result.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  )

  // Underline: __text__ (before italic to avoid conflicts)
  result = result.replace(/__(.+?)__/g, "<u>$1</u>")

  // Bold: **text**
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")

  // Italic: _text_  (avoid matching inside words/URLs by using word boundary-like check)
  result = result.replace(/(^|[\s(])_([^_]+?)_(?=[\s).,!?;:]|$)/g, "$1<em>$2</em>")

  // Bare URLs (not already inside an href)
  result = result.replace(
    /(?<!href="|">)(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
  )

  return result
}

export function parseMarkdown(text: string): string {
  const lines = text.split("\n")
  const htmlParts: string[] = []
  let inList = false

  for (const line of lines) {
    const trimmed = line.trimStart()

    // Bullet list item: starts with "- "
    if (trimmed.startsWith("- ")) {
      if (!inList) {
        htmlParts.push("<ul>")
        inList = true
      }
      htmlParts.push(`<li>${parseInline(trimmed.slice(2))}</li>`)
      continue
    }

    // Close list if we were in one
    if (inList) {
      htmlParts.push("</ul>")
      inList = false
    }

    // Empty line → paragraph break
    if (trimmed === "") {
      htmlParts.push("")
      continue
    }

    // Regular paragraph
    htmlParts.push(`<p>${parseInline(line)}</p>`)
  }

  // Close any trailing list
  if (inList) {
    htmlParts.push("</ul>")
  }

  return htmlParts.filter((p) => p !== "").join("\n")
}

/**
 * Extract URLs from markdown text, including both bare URLs and [text](url) links.
 */
export function extractMarkdownUrls(content: string): string[] {
  const urls: string[] = []

  // [text](url)
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
  let match
  while ((match = linkRegex.exec(content)) !== null) {
    if (!urls.includes(match[2])) urls.push(match[2])
  }

  // Bare URLs (not inside markdown link syntax)
  const bareRegex = /(?<!\]\()https?:\/\/[^\s)<]+/g
  while ((match = bareRegex.exec(content)) !== null) {
    if (!urls.includes(match[0])) urls.push(match[0])
  }

  return urls
}
