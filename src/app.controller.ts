import express from "express"
import type { Express, Response, Request } from "express"
import { authRouter } from "./modules"
import cors from 'cors'
import { globalErrorHandler } from "./middleware/error.middleware"
import { PORT } from "./config/env.service"

export const bootstrap = (): void => {

    const app: Express = express()
    app.use(cors(), express.json())
    app.use('/auth', authRouter)

    app.use(globalErrorHandler)
    app.listen(PORT, () => {
        console.log(`server run in port ${PORT}`);

    })
}