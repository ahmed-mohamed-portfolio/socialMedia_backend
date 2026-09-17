import { Router } from "express";
import type { NextFunction, Request, Response } from "express"
import { authentication } from "../../middleware/auth.middleware";
import { cloudeFileUpload, fileFieldValidation } from "../../common/utils/multer";
import { SuccessResponse } from "../../common/exceptions/success.response";
import { validation } from "../../middleware/validation.middleware";
import { createPostSchema, deletePostSchema, getSinglePostSchema, getUserPostsSchema, reactPostSchema, updatePostSchema } from "./post.validation";
import { postService } from "./post.service";
import { PaginateDto, paginationValidationSchema } from "../../common/validation";
import { deletePostSchemaDto, getSinglePostParamsDto, getUserPostsParamDto, ReactPostParamsDto, ReactPostQueryDto, updatePostBodyDto, updatePostParamsDto } from "./post.dto";
import { commentRouter } from "../comment";


const router = Router()

router.use('/:postId/comment', commentRouter)

router.get('/', authentication, validation(paginationValidationSchema), async (req: Request, res: Response, next: NextFunction) => {
    // console.log("req", req);

    let data = await postService.postList(req.query as PaginateDto, req.user)
    return SuccessResponse({ res, status: 201, data })
})

router.post('/', authentication, cloudeFileUpload({ validation: fileFieldValidation.image, maxSize: 20 }).array("attachments", 2), validation(createPostSchema), async (req: Request, res: Response, next: NextFunction) => {
    // console.log("req", req);

    let data = await postService.createPost({ ...req.body, files: req.files }, req.user)
    return SuccessResponse({ res, status: 201, data })
})

router.patch('/:postId/react', authentication, validation(reactPostSchema), async (req: Request, res: Response, next: NextFunction) => {
    // console.log("req.query", req.query);

    let data = await postService.reactPost(req.params as ReactPostParamsDto, req.query as unknown as ReactPostQueryDto, req.user)

    return SuccessResponse({ res, status: 200, data })

})

router.patch('/:postId', authentication, cloudeFileUpload({ validation: fileFieldValidation.image, maxSize: 20 }).array("attachments", 2), validation(updatePostSchema), async (req: Request, res: Response, next: NextFunction) => {

    let data = await postService.updatePost(req.params as updatePostParamsDto, req.body as updatePostBodyDto, req.user)

    return SuccessResponse({ res, status: 200, data })

})

router.get('/:id', authentication, validation(getSinglePostSchema), async (req: Request, res: Response, next: NextFunction) => {

    let data = await postService.getSinglePost(req.params as getSinglePostParamsDto)

    return SuccessResponse({ res, status: 200, data })

})

router.get('/user/:userId', authentication, validation(getUserPostsSchema), async (req: Request, res: Response, next: NextFunction) => {

    let data = await postService.userPosts(req.params as getUserPostsParamDto)

    return SuccessResponse({ res, status: 200, data })

})

router.delete('/:postId', authentication, validation(deletePostSchema), async (req: Request, res: Response, next: NextFunction) => {

    let data = await postService.deletePost(req.params as deletePostSchemaDto, req.user)

    return SuccessResponse({ res, status: 200, data })

})

export default router