import { Router } from "express"
import type { Request, Response } from "express"
import authService from "./auth.service"
import { SuccessResponse } from "../../common/exceptions/success.response"
import { signinSchema, signupSchema, verifySchema } from "./auth.validation"
import { validation } from "../../middleware/validation.middleware"

const router = Router()

router.post("/signin", validation(signinSchema), async (req: Request, res: Response) => {
    let host = `${req.protocol}://${req.host}`

    let data = await authService.login(req.body, host)
    SuccessResponse({ res, message: "signin success", data })
})

router.post("/signup", validation(signupSchema), async (req: Request, res: Response) => {
    let data = await authService.signup(req.body)
    SuccessResponse({ res, message: "signup success", data })
})

router.post("/verify", validation(verifySchema), async (req: Request, res: Response) => {
    let data = await authService.verifyEmail(req.body)
    return SuccessResponse({ res, message: "email verified", status: 200, data })
})

export default router
