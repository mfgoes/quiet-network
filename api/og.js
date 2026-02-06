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
    ua.includes('telegrambot') ||
    ua.includes('slackbot') ||
    ua.includes('discordbot') ||
    ua.includes('ia_archiver') ||
    ua.includes('googlebot')
  )
}

// Extract post ID from URL path
function extractPostId(pathname) {
  const match = pathname.match(/\/p\/([a-f0-9-]+)$/i)
  return match ? match[1] : null
}

// Strip HTML tags and truncate text
function sanitizeText(html, maxLength = 200) {
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text.length > maxLength
    ? text.slice(0, maxLength).trim() + '...'
    : text
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

// Generate meta tags
function generateMetaTags(post, siteUrl) {
  const author = escapeHtml(post.profiles?.display_name || 'Someone')
  const circle = escapeHtml(post.circles?.name || 'a circle')
  const content = sanitizeText(post.content, 200)
  const url = extractFirstUrl(post.content)

  let title = `${author} in ${circle}`
  if (url) {
    try {
      const domain = new URL(url).hostname.replace('www.', '')
      title = `${author} shared ${domain}`
    } catch (e) {
      // Invalid URL, use default
    }
  }

  const description = escapeHtml(content || `A post by ${author} in ${circle}`)

  let imageUrl = `${siteUrl}/images/landscape_with_boats.jpg`
  if (url) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    if (imageExtensions.some(ext => url.toLowerCase().includes(ext))) {
      imageUrl = url
    }
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

  // Only process post detail pages with crawler user agents
  const postId = extractPostId(pathname)
  if (!postId || !isCrawler(userAgent)) {
    // Redirect non-crawlers to index.html (client-side routing takes over)
    const indexUrl = new URL('/index.html', request.url)
    const response = await fetch(indexUrl.toString())
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    })
  }

  try {
    // Fetch post data
    const post = await fetchPostData(postId)
    if (!post) {
      // Post not found, return regular index.html
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
      // Error fetching index, return as-is
      return new Response(response.body, {
        status: response.status,
        headers: response.headers,
      })
    }

    let html = await response.text()

    // Generate meta tags
    const siteUrl = `${url.protocol}//${url.host}`
    const metaTags = generateMetaTags(post, siteUrl)

    // Remove existing meta tags
    html = html.replace(/<meta property="og:[^"]*"[^>]*>\n?/g, '')
    html = html.replace(/<meta name="twitter:[^"]*"[^>]*>\n?/g, '')
    html = html.replace(/<meta name="description"[^>]*>\n?/g, '')

    // Inject new tags
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
