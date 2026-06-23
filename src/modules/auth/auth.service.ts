import { AplicationException } from "../../common/exceptions/application.exceptions"
import { loginDto } from "./auth.dto"



class authService {
    constructor() {

    }

    login(data: loginDto): loginDto {
        throw new AplicationException("error form login", 505)

    }
}


export default new authService