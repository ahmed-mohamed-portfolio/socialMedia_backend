import { Router } from "express";
import type { Request, Response } from "express";
import authService from "./auth.service";
import { SuccessResponse } from "../../common/exceptions/success.response";
import { signupSchema } from "./auth.validation";
import { validation } from "../../middleware/validation.middleware";



const router = Router()


router.post('/signup', validation(signupSchema), async (req: Request, res: Response) => {

    let data = await authService.signup(req.body)
    SuccessResponse({ res, message: "signup success", data })
})

export default router