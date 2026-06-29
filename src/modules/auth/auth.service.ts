import { HydratedDocument, Model } from "mongoose"
import { signupDto } from "./auth.dto"
import { IUser } from "../../common/interfaces"
import userModel from "../../database/model/user.model"
import { BadRequestException } from "../../common/exceptions/application.exceptions"


class authService {

    private userModel: Model<IUser>

    constructor() {
        this.userModel = userModel
    }

    async signup(data: signupDto): Promise<IUser> {
        let result: HydratedDocument<IUser> = await this.userModel.create(data)
        if (!result) {
            throw new BadRequestException("user not created")
        }
        return result.toJSON()
    }

}


export default new authService