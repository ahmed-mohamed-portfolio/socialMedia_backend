import { Router } from "express";
import type { Request, Response } from "express";
import authService from "./auth.service";
import { SuccessResponse } from "../../common/exceptions/success.response";



const router = Router()

router.post('/login', (req: Request, res: Response) => {
    let loginData = authService.login(req.body)
    SuccessResponse({ res, data: loginData })
})



export default router