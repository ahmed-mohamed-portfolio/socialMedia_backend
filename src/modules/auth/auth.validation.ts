import { z } from "zod"

export const signupSchema = {
    body: z
        .strictObject({
            userName: z.string().min(2).max(20),
            email: z.email({ error: "email not right" }),
            password: z.string().min(5).max(20),
            phone: z.string().min(5).max(20),
            confirmPassword: z.string().min(5).max(20)
        })
        .refine(
            (data) => {
                return data.password == data.confirmPassword
            },
            {
                message: "passwords dont match",
                path: ["confirmPassword"]
            }
        )
}

export const signinSchema = {
    body: z.strictObject({
        email: z.email({ error: "email not right" }),
        password: z.string().min(5).max(20)
    })
}

export const verifySchema = {
    body: z.strictObject({
        email: z.email({ error: "email not right" }),
        code: z.string().min(4).max(4)
    })
}
