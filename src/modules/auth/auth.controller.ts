import { Router } from "express"
import type { Request, Response } from "express"
import authService from "./auth.service"
import { SuccessResponse } from "../../common/exceptions/success.response"
import { signinSchema, signupSchema, verifySchema } from "./auth.validation"
import { validation } from "../../middleware/validation.middleware"
import { ConflictException } from "../../common/exceptions/application.exceptions"

const router = Router()

router.post("/signin", validation(signinSchema), async (req: Request, res: Response) => {
    let host = `${req.protocol}://${req.host}`

    let data = await authService.login(req.body, host)


    res.cookie("refreshToken", data.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/"
    })


    res.cookie("accessToken", data.accessToken, {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        path: "/"
    })


    SuccessResponse({ res, message: "signin success", data })
})

router.post("/signup", validation(signupSchema), async (req: Request, res: Response) => {
    let data = await authService.signup(req.body)
    SuccessResponse({ res, message: "success", data })
})

router.post("/verify", validation(verifySchema), async (req: Request, res: Response) => {
    let data = await authService.verifyEmail(req.body)
    return SuccessResponse({ res, message: "email verified", status: 200, data })
})

const getCookieValue = (req: Request, key: string) => {
    const cookies = req.headers.cookie
    if (!cookies) {
        return null
    }

    for (const cookie of cookies.split(";")) {
        const [cookieKey, ...cookieValueParts] = cookie.trim().split("=")
        if (cookieKey === key) {
            return decodeURIComponent(cookieValueParts.join("="))
        }
    }

    return null
}

router.post("/signup/gmail", async (req: Request, res: Response) => {


    //? i used this email ==> ahmed.mohamed.connect@gmail.com

    //req.headers.cookie ==> this dont work till front and back in same domain or local host

    const csrfCookie = getCookieValue(req, "g_csrf_token");
    const csrfBody = req.body?.g_csrf_token;

    if (!csrfCookie || !csrfBody || csrfCookie !== csrfBody) {
        throw new ConflictException("Invalid Google CSRF token");
    }

    let host = `${req.protocol}://${req.host}`

    let { message, status, data } = await authService.signupWithGmail(req.body.credential, host)


    // if success

    res.cookie("refreshToken", data.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/"
    })


    res.cookie("accessToken", data.accessToken, {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        path: "/"
    })

    return res.redirect("http://localhost:4200/timeLine")
})

export default router
