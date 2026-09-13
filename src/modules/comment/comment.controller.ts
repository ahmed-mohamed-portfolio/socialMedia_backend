import { Router } from "express";
import type { NextFunction, Request, Response } from "express"
import { authentication } from "../../middleware/auth.middleware";
import { cloudeFileUpload, fileFieldValidation } from "../../common/utils/multer";
import { SuccessResponse } from "../../common/exceptions/success.response";
import { validation } from "../../middleware/validation.middleware";
import { commentService } from "./comment.service";
import { createCommentSchema, createReplyOnCommentSchema } from "./comment.validation";
import { createCommentParamsDto, createReplyOnCommentParamsDto } from "./comment.dto";


const router = Router({ mergeParams: true })



router.post('/', authentication, cloudeFileUpload({ validation: fileFieldValidation.image, maxSize: 20 }).array("attachments", 2), validation(createCommentSchema), async (req: Request, res: Response, next: NextFunction) => {
    // console.log("req", req);

    let data = await commentService.createComment(req.params as createCommentParamsDto, { ...req.body, files: req.files }, req.user)
    return SuccessResponse({ res, status: 201, data })
})


router.post('/:commentId/reply', authentication, cloudeFileUpload({ validation: fileFieldValidation.image, maxSize: 20 }).array("attachments", 2), validation(createReplyOnCommentSchema), async (req: Request, res: Response, next: NextFunction) => {
    // console.log("req", req);

    let data = await commentService.replyOnComment(req.params as createReplyOnCommentParamsDto, { ...req.body, files: req.files }, req.user)
    return SuccessResponse({ res, status: 201, data })
})

export default router