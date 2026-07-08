import { EventEmitter } from "events"
import { sendEmail } from "./sendEmail"
import { verifyEmailTemplate } from "./verifyEmailTemplate"
import { BadRequestException } from "../../exceptions/application.exceptions"
import { SecurityService } from "../../services/security.services"

export let verifyEmailEvent = new EventEmitter()
const securityService = new SecurityService()

//? send gmail verify code
verifyEmailEvent.on("verifyEmail", async (data) => {
    let { userId, email } = data

    let code = Math.floor(Math.random() * 10000).toString()

    try {
        // await set({
        //     key: `OTP::${userId}`,
        //     value: await securityService.generateHash({ planText: code }),
        //     ttl: 5 * 60
        // })

        await sendEmail({
            to: email,
            subject: "verify your email",
            html: verifyEmailTemplate(code)
        })
    } catch (error) {
        throw new BadRequestException("problem in send verification code", error)
    }
})
