import z from 'zod'
import { createCommentSchema, createReplyOnCommentSchema, deleteCommentSchema, updateCommentSchema } from './comment.validation'


export type createCommentBodyDto = z.infer<typeof createCommentSchema.body>

export type createCommentParamsDto = z.infer<typeof createCommentSchema.params>

export type createReplyOnCommentParamsDto = z.infer<typeof createReplyOnCommentSchema.params>

export type updateCommentParamsDto = z.infer<typeof updateCommentSchema.params>;

export type updateCommentBodyDto = z.infer<typeof updateCommentSchema.body>;

export type deleteCommentParamsDto = z.infer<typeof deleteCommentSchema.params>;