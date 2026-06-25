"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupSchema = void 0;
const zod_1 = require("zod");
exports.signupSchema = {
    body: zod_1.z.strictObject({
        name: zod_1.z.string().min(2).max(20),
        email: zod_1.z.email({ error: "email not right" }),
        password: zod_1.z.string().min(5).max(20),
        confirmPassword: zod_1.z.string().min(5).max(20)
    }).refine((data) => {
        return data.password == data.confirmPassword;
    }, {
        message: "passwords dont match",
        path: ["confirmPassword"]
    })
};
