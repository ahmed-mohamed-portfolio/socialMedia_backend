import { Router } from "express";
import type { Request, Response } from "express";
import authService from "./auth.service";
import { SuccessResponse } from "../../common/exceptions/success.response";
import { signupSchema } from "./auth.validation";
import { BadRequestException } from "../../common/exceptions/application.exceptions";
import { validation } from "../../middleware/validation.middleware";



const router = Router()

router.post('/login', (req: Request, res: Response) => {
    let loginData = authService.login(req.body)
    SuccessResponse({ res, data: loginData })
})

router.post('/signup', validation(signupSchema), (req: Request, res: Response) => {

    SuccessResponse({ res, data: req.body })
})

export default router