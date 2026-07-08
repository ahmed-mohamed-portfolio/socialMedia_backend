"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmailEvent = void 0;
const events_1 = require("events");
const sendEmail_1 = require("./sendEmail");
const verifyEmailTemplate_1 = require("./verifyEmailTemplate");
const application_exceptions_1 = require("../../exceptions/application.exceptions");
const security_services_1 = require("../../services/security.services");
exports.verifyEmailEvent = new events_1.EventEmitter();
const securityService = new security_services_1.SecurityService();
//? send gmail verify code
exports.verifyEmailEvent.on("verifyEmail", async (data) => {
    let { userId, email } = data;
    let code = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    try {
        // await set({
        //     key: `OTP::${userId}`,
        //     value: await securityService.generateHash({ planText: code }),
        //     ttl: 5 * 60
        // })
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
