import jwt, { JwtPayload } from "jsonwebtoken"
import crypto from "node:crypto"
import { BadRequestException } from "../exceptions/application.exceptions"
import { jwt_admin_refresh_signature, jwt_admin_signature, jwt_user_refresh_signature, jwt_user_signature } from "../../config/index"
import { DatabaseRepository } from "../../database/repository/base.repository"
import userModel from "../../database/model/user.model"
import { redisService } from "./redis.service"
import { existuser } from "../../modules/auth/auth.dto"
import { RoleEnum } from "../enums"
import { IUser } from "../interfaces"
import { HydratedDocument, Model } from "mongoose"

export class TokenService {
    private userModel: Model<IUser>
    private userRepository: DatabaseRepository<IUser>
    constructor() {
        this.userModel = userModel
        this.userRepository = new DatabaseRepository(this.userModel)
    }

    generateToken(existUser: HydratedDocument<IUser>, issuer: string): { accessToken: string; refreshToken: string } {
        let audience: string | undefined = undefined
        let signature: string | undefined = undefined
        let refreshSignature: string | undefined = undefined

        switch (existUser.role) {
            case RoleEnum.admin:
                signature = jwt_admin_signature
                refreshSignature = jwt_admin_refresh_signature
                audience = "Admin"
                break

            case RoleEnum.user:
                signature = jwt_user_signature
                refreshSignature = jwt_user_refresh_signature
                audience = "User"
                break
        }

        let jwtid: string = crypto.randomBytes(10).toString("hex")

        if (!signature) {
            throw new BadRequestException("bad signature")
        }
        //!i put it for test 1m
        let accessToken = jwt.sign({ id: existUser._id, firstName: existUser.firstName, lastName: existUser.lastName, email: existUser.email }, signature, {
            expiresIn: "1m",
            issuer,
            audience,
            jwtid
        })

        if (!refreshSignature) {
            throw new BadRequestException("bad signature")
        }
        let refreshToken = jwt.sign(
            { id: existUser._id, firstName: existUser.firstName, lastName: existUser.lastName, email: existUser.email },
            refreshSignature,
            {
                expiresIn: "1y",
                audience,
                jwtid
            }
        )

        return { accessToken, refreshToken }
    }

    decodeToken(token: string): string | jwt.JwtPayload {
        let decoded = jwt.decode(token) as JwtPayload

        if (!decoded) {
            throw new BadRequestException("invalid decoded")
        }

        let signature: string | undefined = undefined

        switch (decoded.aud) {
            case "Admin":
                signature = jwt_admin_signature
                break

            default:
                signature = jwt_user_signature
                break
        }

        let decodedData: string | jwt.JwtPayload = jwt.verify(token, signature)

        return decodedData
    }

    async decodeRefreshToken(token: string): Promise<JwtPayload> {
        const splitToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token

        let decoded = jwt.decode(splitToken) as JwtPayload

        let refreshSignature: string | undefined = undefined
        if (!decoded) {
            throw new BadRequestException("invalid token")
        }
        switch (decoded.aud) {
            case "Admin":
                refreshSignature = jwt_admin_refresh_signature
                break

            default:
                refreshSignature = jwt_user_refresh_signature
                break
        }

        let decodedData = jwt.verify(token, refreshSignature) as JwtPayload

        let user = await this.userRepository.findById(decodedData.id)

        if (!decodedData.iat) {
            throw new BadRequestException("no decodedData.iat")
        }
        if (Math.floor(new Date(user.credentialsUpdatedAt).getTime() / 1000) > decodedData.iat) {
            throw new BadRequestException("invalid token2211")
        }

        let blocked_Token = await redisService.get(`RevokeToken::${decodedData.id}::${decodedData.jti}`)
        if (blocked_Token !== null) {
            throw new BadRequestException("invalid token (blocked 2)")
        }

        return decodedData
    }
}
