// dto : data to json

import z from "zod"
import { changePasswordSchema, signinSchema, signupSchema, verifySchema } from "./auth.validation"




export type loginDto = z.infer<typeof signinSchema.body>

export type signupDto = z.infer<typeof signupSchema.body>

export type verifyEmailDto = z.infer<typeof verifySchema.body>

export type changePasswordDto = z.infer<typeof changePasswordSchema.body>
