import Redis from 'ioredis'

/**
 * Redis Client Singleton
 * 
 * Configuration :
 * - REDIS_URL dans .env (ex: redis://localhost:6379)
 * - Pour production : Upstash, Redis Cloud, etc.
 */

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error('❌ Redis connection failed after 3 retries')
        return null // Stop retrying
      }
      return Math.min(times * 100, 3000) // Exponential backoff, max 3s
    },
    // Reconnect automatiquement
    lazyConnect: false,
    enableReadyCheck: true,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await redis.quit()
  })

  process.on('SIGINT', async () => {
    await redis.quit()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await redis.quit()
    process.exit(0)
  })
}

// Event handlers
redis.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Redis connected')
  }
})

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message)
})

redis.on('close', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️  Redis connection closed')
  }
})

export default redis

