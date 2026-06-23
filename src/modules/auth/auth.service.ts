import { loginDto } from "./auth.dto"



class authService {
    constructor() {

    }

    login(data: loginDto): loginDto {
        return data
        // throw new AplicationException("error form login", 505)

    }
}


export default new authService