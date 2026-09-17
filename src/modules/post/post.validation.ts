import { z } from 'zod'
import { AvailabilityEnum } from '../../common/enums'
import { Types } from 'mongoose'
import { generalValidationFields } from '../../common/validation'
import { fileFieldValidation } from '../../common/utils/multer'


export const createPostSchema = {
    body: z.strictObject({
        content: z.string().optional(),
        files: z.array(generalValidationFields.file(fileFieldValidation.image)).optional(),
        tags: z.array(z.string()).optional(),
        availability: z.coerce.number().default(AvailabilityEnum.PUBLIC)
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

            // التأكد إن كل tag عبارة عن MongoDB ObjectId صحيح
            for (const tag of args.tags) {

                if (!Types.ObjectId.isValid(tag)) {
                    ctx.addIssue({
                        code: "custom",
                        path: ["tags"],
                        message: `Invalid tagged objectId ${tag}`
                    })
                }
            }
        }
    })
}

export const updatePostSchema = {
    params: z.strictObject({
        postId: generalValidationFields.id
    })
    ,
    body: z.strictObject({

        content: z.string().optional(),

        removeFiles: z.array(z.string()).optional(),
        removeTags: z.array(z.string()).optional(),

        files: z.array(generalValidationFields.file(fileFieldValidation.image)).optional(),
        tags: z.array(generalValidationFields.id).optional(),
        availability: z.coerce.number().optional()

    }).superRefine((args, ctx) => {

        if (!Object.values(args)?.length) {
            ctx.addIssue({
                code: "custom",
                message: "Insert data to update"
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

export const reactPostSchema = {
    params: z.strictObject({
        postId: generalValidationFields.id
    })
    ,
    query: z.strictObject({
        react: z.coerce.number()
    })
}

export const getSinglePostSchema = {
    params: z.strictObject({
        id: generalValidationFields.id
    })

}

export const getUserPostsSchema = {
    params: z.strictObject({
        userId: generalValidationFields.id
    })

}

export const deletePostSchema = {
    params: z.strictObject({
        postId: generalValidationFields.id
    })

}


