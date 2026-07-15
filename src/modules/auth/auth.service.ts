import { DatabaseRepository } from "./../../database/repository/base.repository"
import { SecurityService } from "./../../common/services/security.services"
import { HydratedDocument, Model } from "mongoose"
import { ConflictException, NotFoundException } from "./../../common/exceptions/application.exceptions"
import { loginDto, signupDto, verifyEmailDto } from "./auth.dto"
import { BadRequestException } from "../../common/exceptions/application.exceptions"
import { verifyEmailEvent } from "../../common/utils/email/email.events"
import { redisService } from "../../common/services/redis.service"
import { IUser } from "../../common/interfaces"
import userModel from "../../database/model/user.model"
import { ProviderEnum, RoleEnum } from "./../../common/enums/index"
import { TokenService } from "../../common/services/token.service"
import { OAuth2Client } from "google-auth-library"
import { gmail_client_id } from "./../../config/env.service"

class authService {
    private userModel: Model<IUser>
    private userRepository: DatabaseRepository<IUser>
    private securityService: SecurityService
    private tokenService: TokenService
    constructor() {
        this.userModel = userModel
        this.userRepository = new DatabaseRepository(this.userModel)
        this.securityService = new SecurityService()
        this.tokenService = new TokenService()
    }

    // async signin(data: loginDto): Promise<HydratedDocument<IUser>> {
    //     let result: HydratedDocument<IUser> | null = await this.userRepository.findone({ email: data.email })
    //     if (!result) {
    //         throw new NotFoundException("user not found")
    //     }

    //     let matchedPassword = await this.securityService.compareHash({ planText: data.password, cypherText: result.password })
    //     if (!matchedPassword) {
    //         throw new BadRequestException("wrong password")
    //     }

    //     return result
    // }

    async login(data: loginDto, issuer: string) {
        let { email, password } = data
        let existUser = await this.userRepository.findOne({ email },)
        console.log("existUser", existUser)

        if (existUser) {
            let isMatched = await this.securityService.compareHash({ planText: password, cypherText: existUser.password })

            if (isMatched) {
                let { accessToken, refreshToken } = this.tokenService.generateToken(existUser, issuer)

                return { existUser, accessToken, refreshToken }
            }
        }

        throw new NotFoundException("user not found")
    }

    async signup(data: signupDto): Promise<IUser> {

        const existuser = await this.userRepository.findOne({ email: data.email })
        if (existuser) {
            throw new BadRequestException("email already signed before")
        }

        const user: HydratedDocument<IUser> = await this.userRepository.findOne({ email: data.email, provider: ProviderEnum.system })
        if (user && user.confirmEmail == false) {
            verifyEmailEvent.emit("verifyEmail", { userId: user._id, email: data.email })
            return user.toJSON()
        }

        data.password = await this.securityService.generateHash({ planText: data.password })

        let result: HydratedDocument<IUser> = await this.userRepository.create(data)

        if (!result) {
            throw new BadRequestException("user not created")
        }

        verifyEmailEvent.emit("verifyEmail", { userId: result._id, email: data.email })

        return result.toJSON()
    }

    async verifyEmail(data: verifyEmailDto) {
        let { email, code } = data

        let user = await this.userRepository.findOne({ email })

        if (!user) {
            throw new NotFoundException("email not found")
        }

        if (user.confirmEmail) {
            throw new ConflictException("email already verified")
        }

        let redisCode = await redisService.get(`OTP::${user._id}`)
        if (!redisCode) {
            throw new NotFoundException("code not found or expired")
        }

        if (await this.securityService.compareHash({ planText: code, cypherText: redisCode })) {
            let userData = await this.userRepository.findByIdAndUpdate(user._id, { confirmEmail: true }, "-password", { new: true })

            if (userData) {
                await redisService.deleteKey(`OTP::${user._id}`)
            }
            return userData
        }

        throw new BadRequestException("code not right")
    }

    async VerifyGoogleAccount(idToken: string) {
        const client = new OAuth2Client()
        const ticket = await client.verifyIdToken({
            idToken,
            /*
               https://console.cloud.google.com/auth/clients?project=c45learnloginbygmail&pli=1
            */
            audience: gmail_client_id
        })
        const payload = ticket.getPayload()
        if (!payload) {
            throw new BadRequestException("bad payload")
        }
        if (!payload.email_verified) {
            throw new BadRequestException("fail to verify by google")
        }

        return payload
    }

    async loginWithGmail(idToken: string, issuer: string) {
        const payload = await this.VerifyGoogleAccount(idToken)

        const user = await this.userRepository.findOne({ email: payload.email })
        console.log("user", user);

        if (!user) {
            throw new NotFoundException("not registered account")
        }

        if (!user.confirmEmail) {
            throw new BadRequestException("email not confirmed")
        }

        let { accessToken, refreshToken } = this.tokenService.generateToken(user, issuer)

        let data = { user, accessToken, refreshToken }
        return { message: "user logged in successfully", status: 200, data }
    }

    signupWithGmail = async (idToken: string, issuer: string) => {

        const payload = await this.VerifyGoogleAccount(idToken)

        console.log("payload", payload);

        if (!payload.email) {
            throw new BadRequestException("Google account has no email")
        }
        const checkExist = await this.userRepository.findOne({ email: payload.email })

        if (checkExist) {
            if (checkExist.provider == ProviderEnum.system && checkExist.confirmEmail == false) {
                await this.userRepository.findOneAndUpdate({ email: payload.email }, { confirmEmail: true })
            }

            return this.loginWithGmail(idToken, issuer)
        }


        const user = await this.userRepository.create({
            firstName: payload.given_name,
            lastName: payload.family_name,
            email: payload.email,
            profilePic: payload.picture,
            confirmEmail: true,
            provider: ProviderEnum.google,
            role: RoleEnum.user
        })
        let { accessToken, refreshToken } = this.tokenService.generateToken(user, issuer)

        let data = { user, accessToken, refreshToken }

        return { message: "user added", status: 201, data }
    }
}

export default new authService()
