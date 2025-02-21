import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCredentialsFromToken } from '@/lib/redis'

// Define paths that should be protected
const PROTECTED_PATHS = [
  '/api/clockwork-notes',
  '/api/clockwork-search',
  '/api/credentials'
]

// Define paths that should be excluded from middleware
const PUBLIC_PATHS = [
  '/_next',
  '/favicon.ico',
  '/api/credentials' // Only POST to credentials should be public
]

export async function middleware(request: NextRequest) {
  // Skip middleware for public paths
  if (PUBLIC_PATHS.some(path => request.nextUrl.pathname.startsWith(path))) {
    // Special handling for /api/credentials
    if (request.nextUrl.pathname === '/api/credentials') {
      // Allow POST requests (for initial credential setup)
      if (request.method === 'POST') {
        return NextResponse.next()
      }
    } else {
      return NextResponse.next()
    }
  }

  // Check if path should be protected
  if (PROTECTED_PATHS.some(path => request.nextUrl.pathname.startsWith(path))) {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No session token provided' },
        { status: 401 }
      )
    }

    const sessionToken = authHeader.split('Bearer ')[1]
    
    try {
      const credentials = await getCredentialsFromToken(sessionToken)
      
      if (!credentials) {
        return NextResponse.json(
          { error: 'Invalid or expired session' },
          { status: 401 }
        )
      }

      // Add user context to request headers
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', credentials.userId)

      // Clone the request with modified headers
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })

      return response
    } catch (error) {
      console.error('Error validating session:', error)
      return NextResponse.json(
        { error: 'Session validation failed' },
        { status: 500 }
      )
    }
  }

  // Allow all other requests
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/api/:path*', // Match all API routes
  ],
}
