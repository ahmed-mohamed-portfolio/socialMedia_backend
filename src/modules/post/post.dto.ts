import z from 'zod'
import { createPostSchema, reactPostSchema } from './post.validation'


export type createPostBodyDto = z.infer<typeof createPostSchema.body>

export type ReactPostQueryDto = z.infer<typeof reactPostSchema.query>

export type ReactPostParamsDto = z.infer<typeof reactPostSchema.params>