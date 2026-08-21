"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.verifySchema = exports.signinSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../common/enums");
exports.signupSchema = {
    body: zod_1.z
        .strictObject({
        userName: zod_1.z.string().min(2).max(20),
        email: zod_1.z.email({ error: "email not right" }),
        password: zod_1.z.string().min(5).max(20),
        phone: zod_1.z.string().min(5).max(20).optional(),
        confirmPassword: zod_1.z.string().min(5).max(20),
        dateOfBirth: zod_1.z.coerce.date(),
        gender: zod_1.z.enum(enums_1.GenderEnum)
    })
        .refine((data) => {
        return data.password == data.confirmPassword;
    }, {
        message: "passwords dont match",
        path: ["confirmPassword"]
    })
};
exports.signinSchema = {
    body: zod_1.z.strictObject({
        email: zod_1.z.email({ error: "email not right" }),
        password: zod_1.z.string().min(5).max(20),
        FCM: zod_1.z.string().optional()
    })
};
exports.verifySchema = {
    body: zod_1.z.strictObject({
        email: zod_1.z.email({ error: "email not right" }),
        code: zod_1.z.string().min(4).max(4)
    })
};
exports.changePasswordSchema = {
    body: zod_1.z.strictObject({
        password: zod_1.z.string().min(5).max(20).nullable(),
        newPassword: zod_1.z.string().min(5).max(20)
    })
};
