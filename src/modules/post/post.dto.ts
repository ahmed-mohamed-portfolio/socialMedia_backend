import z from 'zod'
import { createPostSchema } from './post.validation'


export type createPostBodyDto = z.infer<typeof createPostSchema.body>