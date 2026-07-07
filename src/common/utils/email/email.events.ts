import { EventEmitter } from "events"
import { sendEmail } from "./sendEmail"
import { verifyEmailTemplate } from "./verifyEmailTemplate"
import { BadRequestException } from "../../exceptions/application.exceptions"

export let event = new EventEmitter()

//? send gmail verify code
event.on("verifyEmail", async (data) => {
    let { userId, email } = data

    let code = Math.floor(Math.random() * 10000).toString()

    try {
        await set({
            key: `OTP::${userId}`,
            value: await generateHash(code),
            ttl: 5 * 60
        })

        await sendEmail({
            to: email,
            subject: "verify your email",
            html: verifyEmailTemplate(code)
        })
    } catch (error) {
        throw new BadRequestException("problem in send verification code", error)
    }
})
