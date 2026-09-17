import z from 'zod'
import { createPostSchema, deletePostSchema, getSinglePostSchema, getUserPostsSchema, reactPostSchema, updatePostSchema } from './post.validation'


export type createPostBodyDto = z.infer<typeof createPostSchema.body>

export type ReactPostQueryDto = z.infer<typeof reactPostSchema.query>

export type ReactPostParamsDto = z.infer<typeof reactPostSchema.params>


export type updatePostBodyDto = z.infer<typeof updatePostSchema.body>

export type updatePostParamsDto = z.infer<typeof updatePostSchema.params>

export type getSinglePostParamsDto = z.infer<typeof getSinglePostSchema.params>

export type getUserPostsParamDto = z.infer<typeof getUserPostsSchema.params>

export type deletePostSchemaDto = z.infer<typeof deletePostSchema.params>