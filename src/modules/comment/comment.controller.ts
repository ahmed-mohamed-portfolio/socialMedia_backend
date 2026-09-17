import { Router } from "express";
import type { NextFunction, Request, Response } from "express"
import { authentication } from "../../middleware/auth.middleware";
import { cloudeFileUpload, fileFieldValidation } from "../../common/utils/multer";
import { SuccessResponse } from "../../common/exceptions/success.response";
import { validation } from "../../middleware/validation.middleware";
import { commentService } from "./comment.service";
import { createCommentSchema, createReplyOnCommentSchema, deleteCommentSchema, updateCommentSchema } from "./comment.validation";
import { createCommentParamsDto, createReplyOnCommentParamsDto, deleteCommentParamsDto, updateCommentBodyDto, updateCommentParamsDto } from "./comment.dto";


const router = Router({ mergeParams: true })


router.post('/', authentication, cloudeFileUpload({ validation: fileFieldValidation.image, maxSize: 20 }).array("attachments", 2), validation(createCommentSchema), async (req: Request, res: Response, next: NextFunction) => {
    // console.log("req", req);

    let data = await commentService.createComment(req.params as createCommentParamsDto, { ...req.body, files: req.files }, req.user)
    console.log(data);

    return SuccessResponse({ res, status: 201, data })
})

router.post('/:commentId/reply', authentication, cloudeFileUpload({ validation: fileFieldValidation.image, maxSize: 20 }).array("attachments", 2), validation(createReplyOnCommentSchema), async (req: Request, res: Response, next: NextFunction) => {
    // console.log("req", req);

    let data = await commentService.replyOnComment(req.params as createReplyOnCommentParamsDto, { ...req.body, files: req.files }, req.user)
    return SuccessResponse({ res, status: 201, data })
})

router.put('/:commentId', authentication, validation(updateCommentSchema), async (req: Request, res: Response, next: NextFunction) => {
    console.log("req.body", req.body);

    const data = await commentService.updateComment(req.params as updateCommentParamsDto, req.body as updateCommentBodyDto, req.user);

    return SuccessResponse({ res, status: 200, data });
}
);

router.delete('/:commentId', authentication, validation(deleteCommentSchema), async (req: Request, res: Response, next: NextFunction) => {
    const data = await commentService.deleteComment(req.params as deleteCommentParamsDto, req.user);

    return SuccessResponse({ res, status: 200, data });
}
);

export default router