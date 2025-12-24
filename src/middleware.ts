import { withAuth } from "next-auth/middleware"

export default withAuth({
    callbacks: {
        authorized({ req, token }) {
            const path = req.nextUrl.pathname

            // Allow public access to login/register and home
            if (path.startsWith("/login") || path.startsWith("/register") || path === "/") {
                return true
            }

            // Allow public access to converter and YouTube downloader features
            if (path.startsWith("/convert") || path.startsWith("/youtube") || path.startsWith("/compress")) {
                return true
            }

            // Protect API routes except auth/register and public features
            if (path.startsWith("/api")) {
                // Allow public API endpoints
                if (path.startsWith("/api/auth") || path.startsWith("/api/register")) return true
                // Allow conversion and YouTube API for guests (optional: add rate limiting)
                if (path.startsWith("/api/convert") || path.startsWith("/api/youtube")) return true
                return !!token
            }

            // Protect dashboard, profile, history, settings - require authentication
            return !!token
        },
    },
})

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/api/:path*",
        // Exclude basic static files
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
}
