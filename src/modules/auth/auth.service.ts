import { SecurityService } from "./../../common/services/security.services"
import { NotFoundException } from "./../../common/exceptions/application.exceptions"
import { HydratedDocument, Model } from "mongoose"
import { loginDto, signupDto } from "./auth.dto"
import { IUser } from "../../common/interfaces"
import userModel from "../../database/model/user.model"
import { BadRequestException } from "../../common/exceptions/application.exceptions"
import { DatabaseRepository } from "../../database/repository/base.repository"
import { sendEmail } from "../../common/utils/email/sendEmail"
import { verifyEmailEvent } from "../../common/utils/email/email.events"

class authService {
    private userModel: Model<IUser>
    private userRepository: DatabaseRepository<IUser>
    private securityService: SecurityService
    constructor() {
        this.userModel = userModel
        this.userRepository = new DatabaseRepository(this.userModel)
        this.securityService = new SecurityService()
    }

    async signin(data: loginDto): Promise<HydratedDocument<IUser>> {
        let result: HydratedDocument<IUser> | null = await this.userRepository.findone({ email: data.email })
        if (!result) {
            throw new NotFoundException("user not found")
        }

        let matchedPassword = await this.securityService.compareHash({ planText: data.password, cypherText: result.password })
        if (!matchedPassword) {
            throw new BadRequestException("wrong password")
        }

        return result
    }

    async signup(data: signupDto): Promise<IUser> {
        console.log(data)

        data.password = await this.securityService.generateHash({ planText: data.password })
        let result: HydratedDocument<IUser> = await this.userRepository.create(data)
        if (!result) {
            throw new BadRequestException("user not created")
        }

        verifyEmailEvent.emit("verifyEmail", { userId: result._id, email: data.email })

        return result.toJSON()
    }
}

export default new authService()
