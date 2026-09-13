import z from 'zod'
import { createCommentSchema } from './comment.validation'


export type createCommentBodyDto = z.infer<typeof createCommentSchema.body>

export type createCommentParamsDto = z.infer<typeof createCommentSchema.params>