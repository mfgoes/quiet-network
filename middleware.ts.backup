// Vercel Edge Middleware for social media preview meta tags
// Uses standard Web APIs compatible with Vercel Edge Runtime

// Detect social media crawlers
function isCrawler(userAgent: string): boolean {
  const crawlerPatterns = [
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    'TelegramBot',
    'Slackbot',
    'Discordbot',
    'ia_archiver', // Alexa
    'Googlebot', // Google
  ]
  return crawlerPatterns.some(pattern =>
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  )
}

// Extract post ID from URL path
function extractPostId(pathname: string): string | null {
  // Match /p/:postId or /:circleSlug/p/:postId
  const match = pathname.match(/\/p\/([a-f0-9-]+)$/i)
  return match ? match[1] : null
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

// Fetch post data from Supabase
async function fetchPostData(postId: string) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
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

// Escape HTML special characters
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Generate meta tags for a post
function generateMetaTags(post: any, siteUrl: string): string {
  const author = escapeHtml(post.profiles?.display_name || 'Someone')
  const circle = escapeHtml(post.circles?.name || 'a circle')
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
  const description = escapeHtml(content || `A post by ${author} in ${circle}`)

  // Image: use shared URL as og:image if it's an image, otherwise use default
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

    <!-- Additional article metadata -->
    <meta property="article:published_time" content="${post.created_at}" />
    <meta property="article:author" content="${author}" />
  `.trim()
}

export default async function middleware(request: Request) {
  const url = new URL(request.url)
  const userAgent = request.headers.get('user-agent') || ''
  const pathname = url.pathname

  // Skip non-HTML requests (assets, API calls, etc.)
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/_next/') ||
    pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|json)$/)
  ) {
    return fetch(request)
  }

  // Only process post detail pages
  const postId = extractPostId(pathname)
  if (!postId) {
    return fetch(request) // Pass through to normal handling
  }

  // Only intercept crawler requests
  if (!isCrawler(userAgent)) {
    return fetch(request) // Pass through to normal handling
  }

  try {
    // Fetch post data
    const post = await fetchPostData(postId)
    if (!post) {
      return fetch(request) // Pass through if post not found
    }

    // Fetch the index.html
    const indexUrl = new URL('/index.html', request.url)
    const response = await fetch(indexUrl)
    let html = await response.text()

    // Generate meta tags
    const siteUrl = `${url.protocol}//${url.host}`
    const metaTags = generateMetaTags(post, siteUrl)

    // Remove existing meta tags to avoid duplicates
    html = html.replace(/<meta property="og:[^"]*"[^>]*>\n?/g, '')
    html = html.replace(/<meta name="twitter:[^"]*"[^>]*>\n?/g, '')
    html = html.replace(/<meta name="description"[^>]*>\n?/g, '')

    // Inject new meta tags after the title
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
    console.error('Error in OG middleware:', error)
    return fetch(request) // Pass through on error
  }
}
