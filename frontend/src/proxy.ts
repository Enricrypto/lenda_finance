import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

// Paths that should be publicly accessible
const publicPaths = ["/login", "/signup", "/api/auth"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = await getToken({ req: request })

  // Allow Next.js internals
  if (pathname.startsWith("/_next/") || publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to /login
  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated user hits /login, send to /overview
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/overview", request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Protect everything except /_next and /api/auth
  matcher: ["/((?!_next|api/auth).*)"]
}
