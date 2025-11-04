/**
 * Rate Limiting Middleware
 * Implements token bucket algorithm for rate limiting
 * Can be upgraded to use Redis for distributed systems
 */

// In-memory store for rate limiting
// TODO: Replace with Redis for production/distributed systems
const rateLimitStore = new Map();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.lastReset > 600000) { // 10 minutes
      rateLimitStore.delete(key);
    }
  }
}, 600000);

/**
 * Rate limit configuration per chatbot
 */
const RATE_LIMITS = {
  // Widget public endpoint
  widget: {
    windowMs: 60 * 1000, // 1 minute window
    maxRequests: 20, // 20 requests per minute per chatbot
    maxRequestsPerIP: 10, // 10 requests per minute per IP
  },

  // Authenticated API endpoint (more generous)
  authenticated: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    maxRequestsPerIP: 30,
  }
};

/**
 * Get client IP address from request
 */
function getClientIP(request) {
  // Check various headers for IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to connection remoteAddress (may not be available in all environments)
  return request.headers.get('cf-connecting-ip') || 'unknown';
}

/**
 * Check rate limit for a key
 */
function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const data = rateLimitStore.get(key);

  if (!data || now - data.lastReset > windowMs) {
    // Reset window
    rateLimitStore.set(key, {
      count: 1,
      lastReset: now,
    });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (data.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: data.lastReset + windowMs,
      retryAfter: Math.ceil((data.lastReset + windowMs - now) / 1000),
    };
  }

  data.count++;
  return {
    allowed: true,
    remaining: limit - data.count,
    resetAt: data.lastReset + windowMs,
  };
}

/**
 * Rate limit middleware for widget endpoints
 */
export async function rateLimitWidget(request, chatbotId) {
  const clientIP = getClientIP(request);
  const config = RATE_LIMITS.widget;

  // Check per-chatbot rate limit
  const chatbotKey = `widget:chatbot:${chatbotId}`;
  const chatbotLimit = checkRateLimit(
    chatbotKey,
    config.maxRequests,
    config.windowMs
  );

  if (!chatbotLimit.allowed) {
    return {
      allowed: false,
      error: 'Rate limit exceeded for this chatbot',
      retryAfter: chatbotLimit.retryAfter,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(chatbotLimit.resetAt).toISOString(),
        'Retry-After': chatbotLimit.retryAfter.toString(),
      },
    };
  }

  // Check per-IP rate limit
  const ipKey = `widget:ip:${clientIP}:${chatbotId}`;
  const ipLimit = checkRateLimit(
    ipKey,
    config.maxRequestsPerIP,
    config.windowMs
  );

  if (!ipLimit.allowed) {
    return {
      allowed: false,
      error: 'Rate limit exceeded for your IP address',
      retryAfter: ipLimit.retryAfter,
      headers: {
        'X-RateLimit-Limit': config.maxRequestsPerIP.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(ipLimit.resetAt).toISOString(),
        'Retry-After': ipLimit.retryAfter.toString(),
      },
    };
  }

  // Both limits passed
  return {
    allowed: true,
    headers: {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': Math.min(chatbotLimit.remaining, ipLimit.remaining).toString(),
      'X-RateLimit-Reset': new Date(chatbotLimit.resetAt).toISOString(),
    },
  };
}

/**
 * Rate limit middleware for authenticated endpoints
 */
export async function rateLimitAuthenticated(request, userId, chatbotId) {
  const config = RATE_LIMITS.authenticated;

  // Check per-user-chatbot rate limit
  const userKey = `auth:user:${userId}:${chatbotId}`;
  const userLimit = checkRateLimit(
    userKey,
    config.maxRequests,
    config.windowMs
  );

  if (!userLimit.allowed) {
    return {
      allowed: false,
      error: 'Rate limit exceeded',
      retryAfter: userLimit.retryAfter,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(userLimit.resetAt).toISOString(),
        'Retry-After': userLimit.retryAfter.toString(),
      },
    };
  }

  return {
    allowed: true,
    headers: {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': userLimit.remaining.toString(),
      'X-RateLimit-Reset': new Date(userLimit.resetAt).toISOString(),
    },
  };
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(key, limit, windowMs) {
  const now = Date.now();
  const data = rateLimitStore.get(key);

  if (!data || now - data.lastReset > windowMs) {
    return {
      count: 0,
      remaining: limit,
      resetAt: now + windowMs,
    };
  }

  return {
    count: data.count,
    remaining: Math.max(0, limit - data.count),
    resetAt: data.lastReset + windowMs,
  };
}

/**
 * Manually reset rate limit for a key (admin function)
 */
export function resetRateLimit(key) {
  rateLimitStore.delete(key);
}

/**
 * Get all rate limit stats (for monitoring)
 */
export function getRateLimitStats() {
  const stats = {
    totalKeys: rateLimitStore.size,
    keys: [],
  };

  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    stats.keys.push({
      key,
      count: data.count,
      lastReset: new Date(data.lastReset).toISOString(),
      age: now - data.lastReset,
    });
  }

  return stats;
}
