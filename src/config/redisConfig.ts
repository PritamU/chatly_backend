import Redis from "ioredis";

const redisUrl = `${process.env.REDIS_URL!}`;
// const redisUrl = `redis://default:i7QVxXlQTXHfeaMZz8ySFkBPxkXYZxym@redis-12690.c305.ap-south-1-1.ec2.redns.redis-cloud.com:12690`;

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
