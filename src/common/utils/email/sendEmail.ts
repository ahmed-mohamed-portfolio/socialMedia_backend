import nodemailer from "nodemailer"
import { nodeMailer_app_email, nodeMailer_app_password } from "../../../config/env.service"
import Mail from "nodemailer/lib/mailer"

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: nodeMailer_app_email,
        pass: nodeMailer_app_password
    }
})

// Send an email using async/await
export let sendEmail = async ({ to, subject, html }: Mail.Options): Promise<void> => {
    const info = await transporter.sendMail({
        from: `"SocialMedia App" <${nodeMailer_app_email}>`,
        to,
        subject,
        html
    })

    console.log("Message sent:", info.messageId)
}
