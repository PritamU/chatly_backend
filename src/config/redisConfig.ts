import { createClient, RedisClientType } from "redis";

const getRedisClient = () => {
  const redisClient: RedisClientType = createClient({
    username: process.env.REDIS_USERNAME!,
    password: process.env.REDIS_PASSWORD!,
    socket: {
      host: process.env.REDIS_HOST!,
      port: Number(process.env.REDIS_PORT!),
    },
  }) as RedisClientType;
  return redisClient;
};

export { getRedisClient };
