import { Router } from "express";
import type { NextFunction, Request, Response } from "express"
import { authentication } from "../../middleware/auth.middleware";
import { cloudeFileUpload, fileFieldValidation } from "../../common/utils/multer";
import { SuccessResponse } from "../../common/exceptions/success.response";
import { validation } from "../../middleware/validation.middleware";
import { commentService } from "./comment.service";
import { createCommentSchema } from "./comment.validation";
import { createCommentParamsDto } from "./comment.dto";


const router = Router({ mergeParams: true })



router.post('/', authentication, cloudeFileUpload({ validation: fileFieldValidation.image, maxSize: 20 }).array("attachments", 2), validation(createCommentSchema), async (req: Request, res: Response, next: NextFunction) => {
    // console.log("req", req);

    let data = await commentService.createComment(req.params as createCommentParamsDto, { ...req.body, files: req.files }, req.user)
    return SuccessResponse({ res, status: 201, data })
})


export default router