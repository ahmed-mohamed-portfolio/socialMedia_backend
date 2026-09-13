import z from 'zod'
import { createCommentSchema, createReplyOnCommentSchema } from './comment.validation'


export type createCommentBodyDto = z.infer<typeof createCommentSchema.body>

export type createCommentParamsDto = z.infer<typeof createCommentSchema.params>





export type createReplyOnCommentParamsDto = z.infer<typeof createReplyOnCommentSchema.params>