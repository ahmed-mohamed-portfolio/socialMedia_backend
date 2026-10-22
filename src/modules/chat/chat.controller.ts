import { Router } from 'express'
import type { NextFunction, Request, Response } from "express"
import { authentication } from '../../middleware/auth.middleware'
import { SuccessResponse } from '../../common/exceptions/success.response'
import { chatService } from './chat.services'


const router = Router()


router.get('/:userId', authentication, async (req: Request, res: Response, next: NextFunction) => {
    console.log("req.query", req.query);

    const chat = await chatService.getChat(req.params.userId as string, req.query as { page: string, size: string }, req.user);
    return SuccessResponse({ res, data: { chat } })
})


export default router