import { NextResponse } from "next/server"

interface RateLimitStore {
  [ip: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (works because we use a stateful custom server, not serverless edge)
const store: RateLimitStore = {}

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now()
  for (const ip in store) {
    if (store[ip].resetTime < now) {
      delete store[ip]
    }
  }
}, 60000)

export function rateLimit(
  req: Request,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute default
) {
  // Try to get IP from headers
  const ip = req.headers.get("x-forwarded-for") ?? 
             req.headers.get("x-real-ip") ?? 
             "127.0.0.1" // Fallback

  const now = Date.now()
  
  if (!store[ip]) {
    store[ip] = {
      count: 1,
      resetTime: now + windowMs
    }
    return null
  }

  // If window has passed, reset
  if (now > store[ip].resetTime) {
    store[ip] = {
      count: 1,
      resetTime: now + windowMs
    }
    return null
  }

  // Increment count
  store[ip].count += 1

  // Check limit
  if (store[ip].count > limit) {
    return new NextResponse(
      JSON.stringify({ 
        error: "Too Many Requests", 
        retryAfter: Math.ceil((store[ip].resetTime - now) / 1000) 
      }),
      { 
        status: 429,
        headers: {
          "Retry-After": Math.ceil((store[ip].resetTime - now) / 1000).toString(),
          "Content-Type": "application/json"
        }
      }
    )
  }

  return null
}
