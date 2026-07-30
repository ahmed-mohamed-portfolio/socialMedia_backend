import express from "express"
import type { Express, Response, Request } from "express"
import { authRouter } from "./modules"
import cors from "cors"
import { globalErrorHandler } from "./middleware/error.middleware"
import { PORT } from "./config/env.service"
import DBconnection from "./database/connection"
import { redisService } from "./common/services/redis.service"
import cookieParser from "cookie-parser"
import { SuccessResponse } from "./common/exceptions/success.response"
import { authentication } from "./middleware/auth.middleware"
import { s3Service } from "./common/services/s3.service"
import { pipeline } from 'node:stream'
import { promisify } from "node:util"

const s3WriteStream = promisify(pipeline)

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



    app.get("/get-cookie", (req: Request, res: Response) => {

        if (req.cookies.accessToken) {

            return res.json({ auth: true })
        } else {
            return res.json({ auth: false })
        }

    })

    app.get('/uploads/*path', async (req: Request, res: Response) => {
        const { download, fileName } = req.query as { download: string, fileName: string }

        const { path } = req.params as { path: string[] }
        const Key = path.join('/')
        console.log("i am here");
        const { Body, ContentType } = await s3Service.getAsset({ Key })
        console.log({ Body, ContentType });
        res.setHeader(
            "Content-Type",
            ContentType || "application/octet-stream"
        );
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
        if (download === 'true') {

            res.setHeader("Content-Disposition", `attachment; filename="${fileName || Key.split("/").pop()}"`); // only apply it for  download
        }

        return await s3WriteStream(Body as NodeJS.ReadableStream, res)

    })

    app.get('/pre-signed/*path', async (req: Request, res: Response) => {
        const { download, fileName } = req.query as { download: string, fileName: string }

        const { path } = req.params as { path: string[] }
        const Key = path.join('/')


        const url = await s3Service.createPreSignedFetchLink({ Key, download, fileName })

        SuccessResponse({ res, data: { url } })
    })

    app.get("/check-health", authentication, (req, res) => {
        return SuccessResponse({ res, message: 'health ok', status: 200, })

    })



    app.use(globalErrorHandler)
    app.listen(PORT, () => {
        console.log(`server run in port ${PORT}`)
    })
}
