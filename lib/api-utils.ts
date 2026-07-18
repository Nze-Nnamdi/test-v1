import { NextResponse } from "next/server"

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN

export function getCorsHeaders(request: Request) {
  const origin = request.headers.get("origin")
  
  // In development, if ALLOWED_ORIGIN is not set, allow same-origin requests
  if (!origin || origin !== ALLOWED_ORIGIN) {
    return {}
  }

  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

export function handleOptions(request: Request) {
  const headers = getCorsHeaders(request)
  return new NextResponse(null, {
    status: 204,
    headers: headers as Record<string, string>,
  })
}

const rateLimit = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(ip: string, limit = 10, windowMs = 3600000): boolean {
  const now = Date.now()
  const record = rateLimit.get(ip)

  if (!record || now > record.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) {
    return xff.split(",")[0].trim()
  }
  const forwarded = request.headers.get("forwarded")
  if (forwarded) {
    const match = forwarded.match(/for=([^;]+)/)
    if (match) return match[1].trim()
  }
  return "127.0.0.1"
}
