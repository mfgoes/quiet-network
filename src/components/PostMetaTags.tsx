'use client'

import { useEffect } from 'react'
import type { Post } from '@/types'

interface PostMetaTagsProps {
  post: Post
}

// Strip HTML tags, markdown formatting, and truncate text
function sanitizeText(html: string, maxLength: number = 200): string {
  const text = html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, ' ') // Remove HTML entities
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
    .replace(/#{1,6}\s+/g, '') // Remove heading markdown
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to text
    .replace(/`([^`]+)`/g, '$1') // Remove code formatting
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  return text.length > maxLength
    ? text.slice(0, maxLength).trim() + '...'
    : text
}

// Extract image URL from post content
function extractImageUrl(content: string): string | null {
  // Try to find img src
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/)
  if (imgMatch) return imgMatch[1]

  // Try to find image URLs
  const imageUrlMatch = content.match(/(https?:\/\/[^\s<>"]+\.(?:jpg|jpeg|png|gif|webp))/i)
  if (imageUrlMatch) return imageUrlMatch[1]

  return null
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
  const sharedUrl = extractFirstUrl(post.content)

  // Title: include circle name
  let title = `${author} in ${circle}`
  if (sharedUrl) {
    try {
      new URL(sharedUrl) // Validate URL
      title = `${author} shared in ${circle}`
    } catch (e) {
      // Invalid URL, keep default
    }
  }

  const fullTitle = `${title} — Quiet Network`

  useEffect(() => {
    document.title = fullTitle
    return () => { document.title = 'Quiet Network' }
  }, [fullTitle])

  // Metadata is handled server-side via generateMetadata in page.tsx
  // This component only handles dynamic client-side title updates
  return null
}
