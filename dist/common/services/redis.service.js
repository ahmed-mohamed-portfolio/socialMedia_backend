"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = exports.RedisService = void 0;
const redis_1 = require("redis");
const config_1 = require("../../config");
const application_exceptions_1 = require("../exceptions/application.exceptions");
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
    //===============================================
    set = async ({ key, value, ttl }) => {
        try {
            let data = typeof value === "string" ? value : JSON.stringify(value);
            return ttl ? await this.client.set(key, data, { EX: ttl }) : await this.client.set(key, data);
        }
        catch (error) {
            throw new application_exceptions_1.ServiceUnavailableException("Fail in redis set operation", error);
        }
    };
    update = async ({ key, value, ttl }) => {
        try {
            if (!(await this.client.exists(key)))
                return 0;
            return await this.set({ key, value, ttl });
        }
        catch (error) {
            throw new application_exceptions_1.ServiceUnavailableException("Fail in redis update operation", error);
        }
    };
    get = async (key) => {
        try {
            const data = await this.client.get(key);
            return data;
        }
        catch (error) {
            throw new application_exceptions_1.ServiceUnavailableException("Fail in redis get operation", error);
        }
    };
    ttl = async (key) => {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            throw new application_exceptions_1.ServiceUnavailableException("Fail in redis ttl operation", error);
        }
    };
    exists = async (key) => {
        try {
            return await this.client.exists(key);
        }
        catch (error) {
            throw new application_exceptions_1.ServiceUnavailableException("Fail in redis exists operation", error);
        }
    };
    expire = async ({ key, ttl }) => {
        try {
            return await this.client.expire(key, ttl);
        }
        catch (error) {
            throw new application_exceptions_1.ServiceUnavailableException("Fail in redis expire operation", error);
        }
    };
    mGet = async (keys = []) => {
        try {
            if (!keys.length)
                return 0;
            return await this.client.mGet(keys);
        }
        catch (error) {
            throw new application_exceptions_1.ServiceUnavailableException("Fail in redis mGet operation", error);
        }
    };
    keys = async (prefix) => {
        try {
            return await this.client.keys(`${prefix}*`);
        }
        catch (error) {
            throw new application_exceptions_1.ServiceUnavailableException("Fail in redis keys operation", error);
        }
    };
    deleteKey = async (key) => {
        try {
            if (!key.length)
                return 0;
            return await this.client.del(key);
        }
        catch (error) {
            throw new application_exceptions_1.ServiceUnavailableException("Fail in redis delete operation", error);
        }
    };
    deleteByPattern = async (pattern) => {
        try {
            let deletedCount = 0;
            for await (const keys of this.client.scanIterator({
                MATCH: `${pattern}*`,
                COUNT: 100
            })) {
                if (keys.length) {
                    deletedCount += await this.client.del(keys);
                }
            }
            return deletedCount;
        }
        catch (error) {
            throw new application_exceptions_1.ServiceUnavailableException("Fail in redis delete operation", error);
        }
    };
    FCM_key(userId) {
        return `user:FCM:${userId.toString()}`;
    }
    async addFCM(userId, FCMToken) {
        return await this.client.sAdd(this.FCM_key(userId), FCMToken);
    }
    async removeFCM(userId, FCMToken) {
        return await this.client.sRem(this.FCM_key(userId), FCMToken);
    }
    async getFCMs(userId) {
        return await this.client.sMembers(this.FCM_key(userId));
    }
    async hasFCMs(userId) {
        return await this.client.sCard(this.FCM_key(userId));
    }
    async removeFCMUser(userId) {
        return await this.client.del(this.FCM_key(userId));
    }
}
exports.RedisService = RedisService;
exports.redisService = new RedisService();
