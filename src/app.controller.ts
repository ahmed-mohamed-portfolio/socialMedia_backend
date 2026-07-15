import express from "express"
import type { Express, Response, Request } from "express"
import { authRouter } from "./modules"
import cors from "cors"
import { globalErrorHandler } from "./middleware/error.middleware"
import { PORT } from "./config/env.service"
import DBconnection from "./database/connection"
import { redisService } from "./common/services/redis.service"
import cookieParser from "cookie-parser"


export const bootstrap = async (): Promise<void> => {
    const app: Express = express()

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(cors({
        origin: [
            "http://localhost:4200",
        ],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization",]
    }));
    app.use("/users", authRouter);


    await redisService.connect()
    await DBconnection()


    app.get("/get-cookie", (req, res) => {

        if (req.cookies.accessToken) {

            return res.json({ auth: true })
        } else {
            return res.json({ auth: false })
        }

    })



    app.use(globalErrorHandler)
    app.listen(PORT, () => {
        console.log(`server run in port ${PORT}`)
    })
}
