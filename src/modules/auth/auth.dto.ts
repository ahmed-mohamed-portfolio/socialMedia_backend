// dto : data to json

import z from "zod"
import { signupSchema, verifySchema } from "./auth.validation"


export interface loginDto {
    email: string
    password: string
}

export type signupDto = z.infer<typeof signupSchema.body>

export type verifyEmailDto = z.infer<typeof verifySchema.body>
