import { redisService } from './../common/services/redis.service';
import { NextFunction, Request, Response } from "express"
import { BadRequestException, UnauthorizedException } from "../common/exceptions/application.exceptions"
import { TokenService } from "../common/services/token.service"
import { IUser } from "../common/interfaces"
import { DatabaseRepository } from "../database/repository/base.repository"
import userModel from "../database/model/user.model"
import { JwtPayload } from "jsonwebtoken"

declare global {
    namespace Express {
        interface Request {
            userId: string,
            jti: string
        }
    }
}

const tokenService = new TokenService()
const userRepository = new DatabaseRepository<IUser>(userModel)

export const authentication = async (req: Request, res: Response, next: NextFunction) => {

    // console.log("!req.cookies.accessToken!req.cookies.accessToken", req.cookies.accessToken);

    if (!req.cookies.accessToken) {
        throw new UnauthorizedException("un authorized")
    }

    let decodedData = tokenService.decodeToken(req.cookies.accessToken) as JwtPayload
    if (!decodedData.iat || !decodedData.id || !decodedData.jti) {
        throw new BadRequestException('bad decodedData')
    }

    let user = await userRepository.findById(decodedData.id)

    if (Math.floor(new Date(user.credentialsUpdatedAt).getTime() / 1000) > decodedData.iat) {
        throw new BadRequestException('invalid token22')
    }


    req.userId = decodedData.id
    req.jti = decodedData.jti

    let blocked_Token = await redisService.get(`RevokeToken::${req.userId}::${req.jti}`)
    if (blocked_Token) {
        throw new BadRequestException('invalid token (blocked 1)')
    }



    next()

}




//!!! i need to complete it
export const authorization = (req: Request, res: Response, next: NextFunction) => {



    next()

}
