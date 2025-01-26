import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL!;

const getRedisClient = () => {
  // const redisClient: RedisClientType = createClient({
  //   username: process.env.REDIS_USERNAME!,
  //   password: process.env.REDIS_PASSWORD!,
  //   socket: {
  //     host: process.env.REDIS_HOST!,
  //     port: Number(process.env.REDIS_PORT!),
  //   },
  // }) as RedisClientType;
  const redis: Redis = new Redis(redisUrl);

  return redis;
};

export { getRedisClient };
