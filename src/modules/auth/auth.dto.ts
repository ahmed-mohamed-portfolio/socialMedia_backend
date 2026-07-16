// dto : data to json

import z from "zod"
import { signupSchema, verifySchema } from "./auth.validation"
import { ObjectId } from "mongoose"
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enums"

export interface loginDto {
    email: string
    password: string
}

export type signupDto = z.infer<typeof signupSchema.body>

export type verifyEmailDto = z.infer<typeof verifySchema.body>
