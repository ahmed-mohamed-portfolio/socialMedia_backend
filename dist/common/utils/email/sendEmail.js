"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_service_1 = require("../../../config/env.service");
const transporter = nodemailer_1.default.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: env_service_1.nodeMailer_app_email,
        pass: env_service_1.nodeMailer_app_password
    }
});
// Send an email using async/await
let sendEmail = async ({ to, subject, html }) => {
    const info = await transporter.sendMail({
        from: `"SocialMedia App" <${env_service_1.nodeMailer_app_email}>`,
        to,
        subject,
        html
    });
    console.log("Message sent:", info.messageId);
};
exports.sendEmail = sendEmail;
