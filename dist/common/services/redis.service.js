"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = void 0;
const redis_1 = require("redis");
class RedisService {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: "rediss://default:gQAAAAAAAjwiAAIgcDEwNTEwMmFmNmIxZDM0N2RiYTc5MDUzYTJkZjZhNTRmNg@steady-gopher-146466.upstash.io:6379"
        });
    }
    async connect() {
        try {
            await this.client.connect();
            console.log("redis connected");
        }
        catch (error) {
            console.log("faild to connect to redis database", error);
        }
    }
}
exports.redisService = new RedisService();
