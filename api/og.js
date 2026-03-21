// Vercel Edge Middleware for Vite projects
// Handles dynamic Open Graph meta tags for social media crawlers

// Detect social media crawlers
function isCrawler(userAgent) {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return (
    ua.includes('facebookexternalhit') ||
    ua.includes('facebot') ||
    ua.includes('twitterbot') ||
    ua.includes('linkedinbot') ||
    ua.includes('whatsapp') ||
    ua.includes('signal') ||
    ua.includes('telegrambot') ||
    ua.includes('slackbot') ||
    ua.includes('discordbot') ||
    ua.includes('ia_archiver') ||
    ua.includes('googlebot') ||
    // LLM crawlers
    ua.includes('gptbot') ||
    ua.includes('chatgpt-user') ||
    ua.includes('perplexitybot') ||
    ua.includes('claudebot') ||
    ua.includes('anthropic-ai') ||
    ua.includes('cohere-ai') ||
    ua.includes('youbot') ||
    ua.includes('ccbot') ||
    ua.includes('applebot') ||
    ua.includes('bingbot')
  )
}

// Extract post ID from URL path
function extractPostId(pathname) {
  const match = pathname.match(/\/p\/([a-f0-9-]+)$/i)
  return match ? match[1] : null
}

// Known non-circle top-level routes
const APP_ROUTES = new Set(['explore', 'about', 'profile', 'notifications', 'settings', 'admin', 'user', 'p', 'api'])

// Extract circle slug from URL path (single-segment paths that aren't app routes)
function extractCircleSlug(pathname) {
  const match = pathname.match(/^\/([^/]+)$/)
  if (!match) return null
  const slug = match[1]
  return APP_ROUTES.has(slug) ? null : slug
}

// Strip HTML tags, markdown formatting, and truncate text
function sanitizeText(html, maxLength = 200) {
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
function extractImageUrl(content) {
  // Try to find img src
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/)
  if (imgMatch) return imgMatch[1]

  // Try to find image URLs (common image extensions)
  const imageUrlMatch = content.match(/(https?:\/\/[^\s<>"]+\.(?:jpg|jpeg|png|gif|webp))/i)
  if (imageUrlMatch) return imageUrlMatch[1]

  return null
}

// Extract first URL from post content
function extractFirstUrl(content) {
  let match = content.match(/href="(https?:\/\/[^"]+)"/)
  if (match) return match[1]

  match = content.match(/\]\((https?:\/\/[^\)]+)\)/)
  if (match) return match[1]

  match = content.match(/(https?:\/\/[^\s<>"]+)/)
  if (match) return match[1]

  return null
}

// Fetch post data from Supabase
async function fetchPostData(postId) {
  // Edge functions need runtime env vars (not VITE_ prefixed)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in Vercel environment variables.')
    return null
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/posts?id=eq.${postId}&select=*,profiles!posts_author_id_fkey(display_name,avatar_emoji,username),circles(name,slug)`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

// Escape HTML
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Fetch circle data from Supabase by slug
async function fetchCircleData(slug) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return null

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/circles?slug=eq.${encodeURIComponent(slug)}&select=name,slug,about,description,avatar_url`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    )
    if (!response.ok) return null
    const data = await response.json()
    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('Error fetching circle:', error)
    return null
  }
}

// Generate meta tags for a circle page
function generateCircleMetaTags(circle, siteUrl) {
  const name = escapeHtml(circle.name)
  const about = circle.about || circle.description || ''
  const description = escapeHtml(sanitizeText(about, 200) || `A circle on Quiet Network`)
  const imageUrl = circle.avatar_url || `${siteUrl}/images/landscape_with_boats.jpg`
  const circleUrl = `${siteUrl}/${circle.slug}`

  return `
    <title>${name} — Quiet Network</title>
    <meta name="description" content="${description}" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${name}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${circleUrl}" />
    <meta property="og:site_name" content="Quiet Network" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${name}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
  `.trim()
}

// Generate meta tags
function generateMetaTags(post, siteUrl) {
  const author = escapeHtml(post.profiles?.display_name || 'Someone')
  const circle = escapeHtml(post.circles?.name || 'a circle')
  const content = sanitizeText(post.content, 200)
  const sharedUrl = extractFirstUrl(post.content)

  // Build title with circle name
  let title = `${author} in ${circle}`
  if (sharedUrl) {
    try {
      const domain = new URL(sharedUrl).hostname.replace('www.', '')
      title = `${author} shared in ${circle}`
    } catch (e) {
      // Invalid URL, keep default
    }
  }

  const description = escapeHtml(content || `A post by ${author} in ${circle}`)

  // Choose image: 1) Image from post content, 2) Circle avatar, 3) Default landscape
  let imageUrl = extractImageUrl(post.content)

  if (!imageUrl && post.circles?.avatar_url) {
    imageUrl = post.circles.avatar_url
  }

  if (!imageUrl) {
    imageUrl = `${siteUrl}/images/landscape_with_boats.jpg`
  }

  const postUrl = post.circles?.slug
    ? `${siteUrl}/${post.circles.slug}/p/${post.id}`
    : `${siteUrl}/p/${post.id}`

  return `
    <title>${title} — Quiet Network</title>
    <meta name="description" content="${description}" />

    <!-- Open Graph -->
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${postUrl}" />
    <meta property="og:site_name" content="Quiet Network" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />

    <!-- Additional metadata -->
    <meta property="article:published_time" content="${post.created_at}" />
    <meta property="article:author" content="${author}" />
  `.trim()
}

export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  const url = new URL(request.url)
  const userAgent = request.headers.get('user-agent') || ''

  // Get the original path from query parameter (passed by rewrite)
  const pathname = url.searchParams.get('path') || url.pathname

  const postId = extractPostId(pathname)
  const circleSlug = !postId ? extractCircleSlug(pathname) : null

  // Non-crawlers or unrecognised paths: serve index.html
  if ((!postId && !circleSlug) || !isCrawler(userAgent)) {
    const indexUrl = new URL('/index.html', request.url)
    const response = await fetch(indexUrl.toString())
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    })
  }

  try {
    const siteUrl = `${url.protocol}//${url.host}`
    let metaTags = null

    if (postId) {
      const post = await fetchPostData(postId)
      if (post) metaTags = generateMetaTags(post, siteUrl)
    } else if (circleSlug) {
      const circle = await fetchCircleData(circleSlug)
      if (circle) metaTags = generateCircleMetaTags(circle, siteUrl)
    }

    if (!metaTags) {
      // Not found, return regular index.html
      const indexUrl = new URL('/index.html', request.url)
      const response = await fetch(indexUrl.toString())
      return new Response(response.body, {
        status: response.status,
        headers: response.headers,
      })
    }

    // Fetch the index.html from the origin
    const indexUrl = new URL('/index.html', request.url)
    const response = await fetch(indexUrl.toString())

    if (!response.ok) {
      return new Response(response.body, {
        status: response.status,
        headers: response.headers,
      })
    }

    let html = await response.text()

    // Remove existing meta tags and inject circle/post-specific ones
    html = html.replace(/<meta property="og:[^"]*"[^>]*>\n?/g, '')
    html = html.replace(/<meta name="twitter:[^"]*"[^>]*>\n?/g, '')
    html = html.replace(/<meta name="description"[^>]*>\n?/g, '')

    html = html.replace(
      /(<title>[^<]*<\/title>)/,
      `$1\n    ${metaTags}`
    )

    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error in OG handler:', error)
    // Return regular index.html on error
    const indexUrl = new URL('/index.html', request.url)
    const response = await fetch(indexUrl.toString())
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    })
  }
}
