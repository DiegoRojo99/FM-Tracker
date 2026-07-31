import { createClient, type RedisClientType } from 'redis'

const globalForRedis = globalThis as unknown as {
  redisClient?: RedisClientType
  redisConnectPromise?: Promise<RedisClientType | null>
  redisWarnedMissingUrl?: boolean
}

const redisUrl = process.env.REDIS_URL;

async function getRedisClient(): Promise<RedisClientType | null> {
  if (!redisUrl) {
    if (!globalForRedis.redisWarnedMissingUrl) {
      console.warn('REDIS_URL is not set. Redis cache is disabled.');
      globalForRedis.redisWarnedMissingUrl = true;
    }

    return null;
  }

  if (globalForRedis.redisClient?.isOpen) return globalForRedis.redisClient;
  if (globalForRedis.redisConnectPromise) return globalForRedis.redisConnectPromise;

  const client = createClient({ url: redisUrl });
  client.on('error', (err) => {
    console.error('Redis client error:', err);
  })

  globalForRedis.redisConnectPromise = client
    .connect()
    .then(() => {
      globalForRedis.redisClient = client;
      return client;
    })
    .catch((err) => {
      console.error('Failed to connect to Redis:', err);
      return null;
    })
    .finally(() => {
      globalForRedis.redisConnectPromise = undefined;
    })

  return globalForRedis.redisConnectPromise;
}

export async function getCachedJSON<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  if (!client) return null;

  const value = await client.get(key);
  if (!value) return null;

  try { return JSON.parse(value) as T; }
  // Bad payload should not break requests; treat as miss.
  catch { return null; }
}

export async function setCachedJSON<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;
  await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
}

export async function deleteCacheKey(key: string): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;
  await client.del(key);
}

export async function readThroughCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<{ data: T; cacheStatus: 'hit' | 'miss' | 'disabled' }> {
  const client = await getRedisClient()
  if (!client) {
    return { data: await fetcher(), cacheStatus: 'disabled' }
  }

  const cached = await getCachedJSON<T>(key)
  if (cached !== null) {
    return { data: cached, cacheStatus: 'hit' }
  }

  const data = await fetcher()
  await setCachedJSON(key, data, ttlSeconds)
  return { data, cacheStatus: 'miss' }
}
