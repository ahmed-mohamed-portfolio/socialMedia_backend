"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = void 0;
const redis_1 = require("redis");
const config_1 = require("../../config");
class RedisService {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: config_1.redis_uri
        });
        this.handleConnection();
    }
    handleConnection() {
        this.client.on("error", () => {
            console.log("redis connection error");
        });
        this.client.on("ready", () => {
            console.log("redis connection ready");
        });
    }
    async connect() {
        await this.client.connect();
        console.log("redis connected");
    }
}
exports.redisService = new RedisService();
