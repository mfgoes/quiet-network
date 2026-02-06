import { Helmet } from 'react-helmet-async'
import type { Post } from '@/types'

interface PostMetaTagsProps {
  post: Post
}

// Strip HTML tags and truncate text
function sanitizeText(html: string, maxLength: number = 200): string {
  const text = html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  return text.length > maxLength
    ? text.slice(0, maxLength).trim() + '...'
    : text
}

// Extract first URL from post content
function extractFirstUrl(content: string): string | null {
  // Try HTML href first
  const hrefMatch = content.match(/href="(https?:\/\/[^"]+)"/)
  if (hrefMatch) return hrefMatch[1]

  // Try markdown link
  const mdMatch = content.match(/\]\((https?:\/\/[^\)]+)\)/)
  if (mdMatch) return mdMatch[1]

  // Try bare URL
  const urlMatch = content.match(/(https?:\/\/[^\s<>"]+)/)
  if (urlMatch) return urlMatch[1]

  return null
}

export function PostMetaTags({ post }: PostMetaTagsProps) {
  const author = post.profiles?.display_name || 'Someone'
  const circle = post.circles?.name || 'a circle'
  const content = sanitizeText(post.content, 200)
  const url = extractFirstUrl(post.content)

  // Title: author in circle or with URL domain
  let title = `${author} in ${circle}`
  if (url) {
    try {
      const domain = new URL(url).hostname.replace('www.', '')
      title = `${author} shared ${domain}`
    } catch (e) {
      // Invalid URL, use default title
    }
  }

  // Description: post content
  const description = content || `A post by ${author} in ${circle}`

  // Image: use shared URL as og:image if it's an image, otherwise use default
  const siteUrl = window.location.origin
  let imageUrl = `${siteUrl}/images/landscape_with_boats.jpg`
  if (url) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    if (imageExtensions.some(ext => url.toLowerCase().includes(ext))) {
      imageUrl = url
    }
  }

  // Post URL
  const postUrl = post.circles?.slug
    ? `${siteUrl}/${post.circles.slug}/p/${post.id}`
    : `${siteUrl}/p/${post.id}`

  return (
    <Helmet>
      <title>{title} — Quiet Network</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={postUrl} />
      <meta property="og:site_name" content="Quiet Network" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Additional article metadata */}
      <meta property="article:published_time" content={post.created_at} />
      <meta property="article:author" content={author} />
    </Helmet>
  )
}
