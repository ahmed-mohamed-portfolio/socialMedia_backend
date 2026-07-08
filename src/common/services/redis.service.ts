import { createClient, RedisClientType } from "redis"

class RedisService {
    private client: RedisClientType
    constructor() {
        this.client = createClient({
            url: "rediss://default:gQAAAAAAAjwiAAIgcDEwNTEwMmFmNmIxZDM0N2RiYTc5MDUzYTJkZjZhNTRmNg@steady-gopher-146466.upstash.io:6379"
        })
    }

    async connect() {
        try {
            await this.client.connect()
            console.log("redis connected")
        } catch (error) {
            console.log("faild to connect to redis database", error)
        }
    }
}

export const redisService = new RedisService()
