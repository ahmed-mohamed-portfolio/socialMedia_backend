import { Router } from 'express'
import type { NextFunction, Request, Response } from "express"
import { authentication } from '../../middleware/auth.middleware'
import { SuccessResponse } from '../../common/exceptions/success.response'
import { chatService } from './chat.services'
import { cloudeFileUpload, fileFieldValidation } from '../../common/utils/multer'


const router = Router()


router.get('/:userId', authentication, async (req: Request, res: Response, next: NextFunction) => {
    console.log("req.query", req.query);

    const chat = await chatService.getChat(req.params.userId as string, req.query as { page: string, size: string }, req.user);
    return SuccessResponse({ res, data: { chat } })
})




//not test in front yet
router.post("/group", authentication, cloudeFileUpload({ validation: fileFieldValidation.image, maxSize: 20 }).single("attachment"),
    async (req: Request, res: Response, next: NextFunction) => {
        const chat = await chatService.createGroup(
            req.body,
            req.file as Express.Multer.File,
            req.user
        );

        return SuccessResponse({ res, data: { chat } });
    }
);

//not test in front yet
router.get("/group/:groupId", authentication, async (req: Request, res: Response, next: NextFunction) => {

    const chat = await chatService.getGroupChat(
        req.params.groupId as string,
        req.query as unknown as {
            page?: string,
            size?: string
        },
        req.user
    );

    return SuccessResponse({ res, data: { chat } });
}
);


export default router