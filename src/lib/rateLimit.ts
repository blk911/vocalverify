// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxPerMinute: number = 10): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now >= record.resetAt) {
    // Reset or create new record
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
    return { allowed: true, remaining: maxPerMinute - 1 };
  }
  
  if (record.count >= maxPerMinute) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: maxPerMinute - record.count };
}

export function getRateLimitKey(req: Request, additionalKey?: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return additionalKey ? `${ip}:${additionalKey}` : ip;
}












