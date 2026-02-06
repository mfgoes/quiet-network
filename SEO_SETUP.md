# SEO and Social Media Preview Setup

This document explains how the SEO and social media preview features work for posts with URLs.

## Overview

Posts on Quiet Network now have dynamic SEO metadata that displays properly when shared on social media platforms like WhatsApp, Twitter, Facebook, etc.

## How It Works

### For Social Media Crawlers (Server-Side)

When social media platforms crawl your links, the **Vercel Edge Middleware** (`middleware.ts`) intercepts the request and:

1. Detects if the request is from a social crawler (Facebook, Twitter, WhatsApp, etc.)
2. Extracts the post ID from the URL
3. Fetches the post data from Supabase
4. Generates dynamic Open Graph and Twitter Card meta tags
5. Injects the tags into the HTML response

**Supported URL patterns:**
- `/p/:postId` - Direct post link
- `/:circleSlug/p/:postId` - Post within a circle

### For Regular Browsers (Client-Side)

For regular browser visits, the **React Helmet** library (`PostMetaTags` component) dynamically updates meta tags on the client side. This improves SEO for search engines that execute JavaScript.

## Meta Tag Generation

For each post, the following metadata is generated:

### Title
- If the post contains a URL: `"{author} shared {domain}"`
- Otherwise: `"{author} in {circle}"`

### Description
- The first 200 characters of the post content (HTML stripped)

### Image
- If the post contains a URL to an image (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`), that image is used
- Otherwise, the default Quiet Network landscape image is used

### Example Meta Tags

```html
<title>John shared example.com — Quiet Network</title>
<meta name="description" content="Check out this amazing article about..." />

<!-- Open Graph -->
<meta property="og:type" content="article" />
<meta property="og:title" content="John shared example.com" />
<meta property="og:description" content="Check out this amazing article about..." />
<meta property="og:image" content="https://quiet-network.vercel.app/images/landscape_with_boats.jpg" />
<meta property="og:url" content="https://quiet-network.vercel.app/neighborhood/p/123" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="John shared example.com" />
<meta name="twitter:description" content="Check out this amazing article about..." />
<meta name="twitter:image" content="https://quiet-network.vercel.app/images/landscape_with_boats.jpg" />
```

## Vercel Configuration

### Environment Variables

The middleware needs access to your Supabase credentials. Make sure these environment variables are set in your Vercel project settings:

1. Go to your Vercel project settings
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables (they should already exist from your initial setup):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Important:** Make sure these variables are available to **Production**, **Preview**, and **Development** environments.

### Middleware

The `middleware.ts` file in the project root is automatically deployed as **Vercel Edge Middleware**. No additional configuration is needed.

### Deploy

Simply push your changes to your Git repository. Vercel will automatically:
1. Detect the middleware.ts file
2. Deploy it as edge middleware
3. Apply it to matching routes (`/p/*` and `*/p/*`)

## Testing

### Test with Social Media Debuggers

After deploying, you can test your social media previews using these debugging tools:

1. **Facebook/Meta Debugger**: https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

### Test Locally

To test the middleware locally:

```bash
# Install Vercel CLI if you haven't already
npm i -g vercel

# Run local dev server with middleware support
vercel dev
```

Then visit a post URL with a crawler user agent:

```bash
curl -H "User-Agent: facebookexternalhit/1.0" http://localhost:3000/p/YOUR_POST_ID
```

You should see the dynamic meta tags in the HTML response.

## Files Modified/Created

### Created
- `middleware.ts` - Edge middleware for crawler detection and meta tag injection
- `src/components/PostMetaTags.tsx` - React component for client-side meta tags
- `SEO_SETUP.md` - This documentation file

### Modified
- `src/App.tsx` - Added `HelmetProvider` wrapper
- `src/components/PostDetailRoute.tsx` - Added `PostMetaTags` component
- `package.json` - Added `react-helmet-async` dependency

## Supported Social Platforms

The middleware detects and serves optimized meta tags for:

- Facebook/Meta
- Twitter/X
- WhatsApp
- LinkedIn
- Telegram
- Slack
- Discord
- Google (for search results)

## Caching

Meta tag responses are cached for 1 hour (`max-age=3600`) to reduce Supabase API calls and improve performance.

## Troubleshooting

### Meta tags not showing on social media

1. Clear the social platform's cache:
   - Facebook: Use the [Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - Twitter: Use the [Card Validator](https://cards-dev.twitter.com/validator)

2. Check that environment variables are set in Vercel:
   - Go to Vercel project settings → Environment Variables
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present

3. Check the middleware logs in Vercel:
   - Go to your Vercel dashboard → Deployments → [Select deployment] → Functions
   - Look for errors in the middleware execution

### Images not displaying

- Ensure the URL in the post content points to a publicly accessible image
- Check that the image URL has a valid extension (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`)
- Verify the image size is reasonable (< 5MB recommended for social platforms)

## Future Improvements

Potential enhancements for the SEO system:

1. **URL Preview Fetching**: Fetch Open Graph data from shared URLs to use richer previews
2. **Custom Thumbnails**: Allow users to upload custom preview images for posts
3. **Schema.org Markup**: Add structured data for better search engine understanding
4. **Image Optimization**: Automatically resize and optimize preview images
5. **A/B Testing**: Test different title/description formats for engagement
