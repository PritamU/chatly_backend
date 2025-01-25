"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = void 0;
const redis_1 = require("redis");
const getRedisClient = () => {
    const redisClient = (0, redis_1.createClient)({
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        socket: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
        },
    });
    return redisClient;
};
exports.getRedisClient = getRedisClient;
