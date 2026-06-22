import express from "express"
import type { Express, Response, Request } from "express"

export const bootstrap = (): void => {

    const app: Express = express()


    app.listen(3000, () => {
        console.log("server run in port 3000");

    })
}