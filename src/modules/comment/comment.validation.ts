import { z } from 'zod'
import { generalValidationFields } from '../../common/validation'
import { fileFieldValidation } from '../../common/utils/multer'


export const createCommentSchema = {
    params: z.strictObject({
        postId: generalValidationFields.id
    })
    ,
    body: z.strictObject({
        content: z.string().optional(),
        files: z.array(generalValidationFields.file(fileFieldValidation.image)).optional(),
        tags: z.array(generalValidationFields.id).optional(),
    }).superRefine((args, ctx) => {

        // لازم البوست يكون فيه content أو files
        if (!args.files?.length && !args.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "Content is required"
            })
        }

        if (args.tags?.length) {

            // التأكد إن مفيش tags متكررة
            const uniqueTags = [...new Set(args.tags)]

            if (uniqueTags.length != args.tags.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "Duplicated tag"
                })
            }


        }
    })
}

export const createReplyOnCommentSchema = {
    params: z.strictObject({
        postId: generalValidationFields.id,
        commentId: generalValidationFields.id

    })
    ,
    body: createCommentSchema.body
}

export const updateCommentSchema = {
    params: z.strictObject({
        postId: generalValidationFields.id,
        commentId: generalValidationFields.id
    }),
    body: z.strictObject({
        content: z.string().trim().min(1, "Comment content is required")
    })
};

export const deleteCommentSchema = {
    params: z.strictObject({
        postId: generalValidationFields.id,
        commentId: generalValidationFields.id
    })
};