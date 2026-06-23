import { AplicationException } from "../../common/exceptions/application.exceptions"
import { loginDto } from "./auth.dto"



class authService {
    constructor() {

    }

    login(data: loginDto): loginDto {
        throw new AplicationException()

    }
}


export default new authService