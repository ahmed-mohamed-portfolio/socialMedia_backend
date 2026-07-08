import { createClient, RedisClientType } from "redis"
import { redis_uri } from "../../config"

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
}

export const redisService = new RedisService()
