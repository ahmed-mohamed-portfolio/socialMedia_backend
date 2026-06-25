import { z } from 'zod'


export const signupSchema = {

    body: z.strictObject({
        name: z.string().min(2).max(20),
        email: z.email({ error: "email not right" }),
        password: z.string().min(5).max(20),
        confirmPassword: z.string().min(5).max(20)
    }).refine((data) => {
        return data.password == data.confirmPassword
    }, {
        message: "passwords dont match",
        path: ["confirmPassword"]
    })


}