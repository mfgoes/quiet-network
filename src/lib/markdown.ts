/**
 * Lightweight markdown-to-HTML parser for Quiet Network posts.
 *
 * Supported syntax:
 *   # Heading 1      → <h1>Heading 1</h1>
 *   ## Heading 2     → <h2>Heading 2</h2>
 *   ### Heading 3    → <h3>Heading 3</h3>
 *   #### Heading 4   → <h4>Heading 4</h4>
 *   **bold**         → <strong>bold</strong>
 *   _italic_         → <em>italic</em>
 *   __underline__    → <u>underline</u>
 *   [text](url)      → <a href="url">text</a>
 *   - list item      → <li>list item</li>  (wrapped in <ul>)
 *   bare URLs        → <a href="url">url</a>
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

    // Check for heading: # through ####
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      if (inList) {
        htmlParts.push("</ul>")
        inList = false
      }
      const level = headingMatch[1].length
      const content = headingMatch[2]
      htmlParts.push(`<h${level}>${parseInline(content)}</h${level}>`)
      continue
    }

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
 * Extract bare URLs from markdown text for embed generation.
 * Deliberately excludes [text](url) links — those render as hyperlinks,
 * not embeds, preserving the author's explicit formatting choice.
 */
export function extractMarkdownUrls(content: string): string[] {
  const urls: string[] = []

  // Bare URLs only (not inside markdown link syntax)
  const bareRegex = /(?<!\]\()https?:\/\/[^\s)<]+/g
  let match
  while ((match = bareRegex.exec(content)) !== null) {
    if (!urls.includes(match[0])) urls.push(match[0])
  }

  return urls
}
