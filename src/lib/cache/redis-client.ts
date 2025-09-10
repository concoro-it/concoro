import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || '');

export const CACHE_TTL = {
  JOB_PAGE: 60 * 5, // 5 minutes
  JOB_LIST: 60 * 2, // 2 minutes
  REGION_DATA: 60 * 10, // 10 minutes
  ENTE_DATA: 60 * 10, // 10 minutes
};

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setCachedData(key: string, data: any, ttl: number): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Redis invalidate error:', error);
  }
}

export function generateCacheKey(type: string, identifier: string): string {
  return `concoro:${type}:${identifier}`;
}
