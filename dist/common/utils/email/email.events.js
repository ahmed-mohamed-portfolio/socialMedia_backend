"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
const events_1 = require("events");
const sendEmail_1 = require("./sendEmail");
const verifyEmailTemplate_1 = require("./verifyEmailTemplate");
const application_exceptions_1 = require("../../exceptions/application.exceptions");
exports.event = new events_1.EventEmitter();
//? send gmail verify code
exports.event.on("verifyEmail", async (data) => {
    let { userId, email } = data;
    let code = Math.floor(Math.random() * 10000).toString();
    try {
        await set({
            key: `OTP::${userId}`,
            value: await generateHash(code),
            ttl: 5 * 60
        });
        await (0, sendEmail_1.sendEmail)({
            to: email,
            subject: "verify your email",
            html: (0, verifyEmailTemplate_1.verifyEmailTemplate)(code)
        });
    }
    catch (error) {
        throw new application_exceptions_1.BadRequestException("problem in send verification code", error);
    }
});
