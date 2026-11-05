/** @type {import('next').NextConfig} */

const supabaseOrigin = (() => {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).origin : ""
  } catch {
    return ""
  }
})()

// Next.js App Router needs inline scripts/styles (RSC payload, theme <style>).
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} https://vitals.vercel-insights.com`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ")

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // The dev server needs eval/websockets, so the CSP is production-only.
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Content-Security-Policy", value: contentSecurityPolicy }]
    : []),
]

const nextConfig = {
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
