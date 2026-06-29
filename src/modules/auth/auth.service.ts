import { NotFoundException } from './../../common/exceptions/application.exceptions';
import { HydratedDocument, Model } from "mongoose"
import { loginDto, signupDto } from "./auth.dto"
import { IUser } from "../../common/interfaces"
import userModel from "../../database/model/user.model"
import { BadRequestException } from "../../common/exceptions/application.exceptions"
import { DatabaseRepository } from "../../database/repository/base.repository"


class authService {

    private userModel: Model<IUser>
    private userRepository: DatabaseRepository<IUser>
    constructor() {
        this.userModel = userModel
        this.userRepository = new DatabaseRepository(this.userModel)
    }

    async signin(data: loginDto): Promise<HydratedDocument<IUser>> {

        let result: HydratedDocument<IUser> | null = await this.userRepository.findone({ email: data.email, password: data.password }, "-password")
        if (!result) {
            throw new NotFoundException("user not found")
        }
        return result
    }

    async signup(data: signupDto): Promise<IUser> {
        let result: HydratedDocument<IUser> = await this.userRepository.create(data)
        if (!result) {
            throw new BadRequestException("user not created")
        }
        return result.toJSON()
    }

}


export default new authService