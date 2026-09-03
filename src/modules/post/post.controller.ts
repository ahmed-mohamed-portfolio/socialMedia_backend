import { Router } from "express";
import type { NextFunction, Request, Response } from "express"
import { authentication } from "../../middleware/auth.middleware";
import { cloudeFileUpload, fileFieldValidation } from "../../common/utils/multer";
import { SuccessResponse } from "../../common/exceptions/success.response";
import { validation } from "../../middleware/validation.middleware";
import { createPostSchema } from "./post.validation";
import { postService } from "./post.service";


const router = Router()



router.get('/', authentication, async (req: Request, res: Response, next: NextFunction) => {
    // console.log("req", req);

    let data = await postService.postList(req.user)
    return SuccessResponse({ res, status: 201, data })
})

router.post('/', authentication, cloudeFileUpload({ validation: fileFieldValidation.image, maxSize: 20 }).array("attachments", 2), validation(createPostSchema), async (req: Request, res: Response, next: NextFunction) => {
    // console.log("req", req);

    let data = await postService.createPost({ ...req.body, files: req.files }, req.user)
    return SuccessResponse({ res, status: 201, data })
})


export default router