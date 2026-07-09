import { createClient, RedisClientType } from "redis"
import { redis_uri } from "../../config"
import { NotFoundException, ServiceUnavailableException } from "../exceptions/application.exceptions"

class RedisService {
    private client: RedisClientType

    constructor() {
        this.client = createClient({
            url: redis_uri
        })

        this.handleConnection()
    }

    handleConnection() {
        this.client.on("error", () => {
            console.log("redis connection error")
        })

        this.client.on("ready", () => {
            console.log("redis connection ready")
        })
    }

    async connect() {
        await this.client.connect()
        console.log("redis connected")
    }

    //===============================================

    set = async ({ key, value, ttl }: { key: string; value: any; ttl?: number }): Promise<string | null> => {
        try {
            let data = typeof value === "string" ? value : JSON.stringify(value)
            return ttl ? await this.client.set(key, data, { EX: ttl }) : await this.client.set(key, data)
        } catch (error) {
            throw new ServiceUnavailableException("Fail in redis set operation", error)
        }
    }

    update = async ({ key, value, ttl }: { key: string; value: any; ttl?: number }): Promise<0 | string | null> => {
        try {
            if (!(await this.client.exists(key))) return 0
            return await this.set({ key, value, ttl })
        } catch (error) {
            throw new ServiceUnavailableException("Fail in redis update operation", error)
        }
    }

    get = async (key: string): Promise<string | null> => {
        try {
            const data = await this.client.get(key)

            if (!data) {
                throw new NotFoundException("key not found")
            }
            return data
        } catch (error) {
            throw new ServiceUnavailableException("Fail in redis get operation", error)
        }
    }

    ttl = async (key: string): Promise<number> => {
        try {
            return await this.client.ttl(key)
        } catch (error) {
            throw new ServiceUnavailableException("Fail in redis ttl operation", error)
        }
    }

    exists = async (key: string): Promise<number> => {
        try {
            return await this.client.exists(key)
        } catch (error) {
            throw new ServiceUnavailableException("Fail in redis exists operation", error)
        }
    }

    expire = async ({ key, ttl }: { key: string; ttl: number }): Promise<number> => {
        try {
            return await this.client.expire(key, ttl)
        } catch (error) {
            throw new ServiceUnavailableException("Fail in redis expire operation", error)
        }
    }

    mGet = async (keys: string[] = []): Promise<0 | (string | null)[]> => {
        try {
            if (!keys.length) return 0
            return await this.client.mGet(keys)
        } catch (error) {
            throw new ServiceUnavailableException("Fail in redis mGet operation", error)
        }
    }

    keys = async (prefix: string): Promise<string[]> => {
        try {
            return await this.client.keys(`${prefix}*`)
        } catch (error) {
            throw new ServiceUnavailableException("Fail in redis keys operation", error)
        }
    }

    deleteKey = async (key: string | string[]): Promise<number> => {
        try {
            if (!key.length) return 0
            return await this.client.del(key)
        } catch (error) {
            throw new ServiceUnavailableException("Fail in redis delete operation", error)
        }
    }

    deleteByPattern = async (pattern: string): Promise<number> => {
        try {
            let deletedCount = 0

            for await (const keys of this.client.scanIterator({
                MATCH: `${pattern}*`,
                COUNT: 100
            })) {
                if (keys.length) {
                    deletedCount += await this.client.del(keys)
                }
            }

            return deletedCount
        } catch (error) {
            throw new ServiceUnavailableException("Fail in redis delete operation", error)
        }
    }
}

export const redisService = new RedisService()
