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
import { gmail_client_id, jwt_admin_signature, jwt_user_signature } from "./../../config/env.service"
import crypto from "node:crypto"
import jwt from "jsonwebtoken"


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

    async login(data: loginDto, issuer: string) {
        let { email, password } = data
        let existUser = await this.userRepository.findOne({ email },)
        // console.log("existUser", existUser)

        // if (!existUser.confirmEmail) {
        //     throw new BadRequestException("email not confirmed")
        // }

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
        // console.log("user", user);

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

        // console.log("payload", payload);

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

    async logOutFromAllDevices(userId: string) {

        let user = await this.userRepository.findByIdAndUpdate(userId, { credentialsUpdatedAt: new Date() }, '_id')

        //THIS IS A saver way =>  // await deleteByPattern(`RevokeToken::${userId}::`)
        await redisService.deleteKey(await redisService.keys(`RevokeToken::${userId}::`))

        if (!user) {
            throw new NotFoundException("user not found")
        }


        return true
    }

    async logOut(userId: string, jti: string) {

        let addToken = await redisService.set({
            key: `RevokeToken::${userId}::${jti}`,
            value: jti,
            ttl: 31536000
        })


        if (!addToken) {
            throw new BadRequestException("cant add token")
        }

        return addToken

    }





    async generateAccessToken(token: string) {

        let decodedData = await this.tokenService.decodeRefreshToken(token)

        let signature: string | undefined = undefined

        switch (decodedData.aud) {
            case "Admin":
                signature = jwt_admin_signature
                break;

            case "User":
                signature = jwt_user_signature
                break;
        }

        let jwtid: string = crypto.randomBytes(10).toString("hex")


        if (!signature) {
            throw new BadRequestException("bad signature")
        }

        let accessToken = jwt.sign({ id: decodedData.id, firstName: decodedData.firstName, lastName: decodedData.lastName, email: decodedData.email }, signature, {
            expiresIn: '1m',
            audience: decodedData.aud,
            jwtid
        })



        return accessToken


    }



    async getUserProfile(userId: string): Promise<HydratedDocument<IUser>> {
        const userInfo: HydratedDocument<IUser> = await this.userRepository.findById(userId, '-password')
        console.log(userInfo);

        if (!userInfo) {
            throw new NotFoundException("user NOt Found")
        }

        return userInfo

    }

    async profileImage(file: Express.Multer.File, userId: string) {

        const user: HydratedDocument<IUser> = await this.userRepository.findById(userId, '-password')
        // console.log(user);

        if (!user) {
            throw new NotFoundException("user NOt Found")
        }


        console.log("file", file);

        return user.toJSON()
    }
}

export default new authService()
