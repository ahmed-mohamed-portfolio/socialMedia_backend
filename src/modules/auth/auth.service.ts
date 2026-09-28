import { StorageApproachEnum, UploadApproachEnum } from './../../common/enums/multer.enum';
import { DatabaseRepository } from "./../../database/repository/base.repository"
import { SecurityService } from "./../../common/services/security.services"
import { HydratedDocument, Model } from "mongoose"
import { ConflictException, NotFoundException } from "./../../common/exceptions/application.exceptions"
import { changePasswordDto, loginDto, signupDto, verifyEmailDto } from "./auth.dto"
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
import { s3Service, S3Service } from "../../common/services/s3.service"
import { notificationService } from '../../common/services/notification.service';
import { populate } from 'dotenv';


class authService {

    private userModel: Model<IUser>
    private userRepository: DatabaseRepository<IUser>
    private securityService: SecurityService
    private tokenService: TokenService
    private s3: S3Service
    constructor() {
        this.userModel = userModel
        this.userRepository = new DatabaseRepository(this.userModel)
        this.securityService = new SecurityService()
        this.tokenService = new TokenService()
        this.s3 = s3Service
    }

    async login(data: loginDto, issuer: string) {
        let { email, password, FCM } = data
        let existUser = await this.userRepository.findOne({ email },)
        // console.log("existUser", existUser)

        // if (!existUser.confirmEmail) {
        //     throw new BadRequestException("email not confirmed")
        // }

        if (existUser) {
            let isMatched = await this.securityService.compareHash({ planText: password, cypherText: existUser.password })

            if (isMatched) {

                if (FCM) {
                    await redisService.addFCM(existUser._id, FCM)
                    const tokens = await redisService.getFCMs(existUser._id)
                    if (tokens?.length) {
                        await notificationService.sendNotificationToTokens({
                            tokens,
                            data: {
                                title: "new login",
                                body: `new login at ${new Date()}`
                            }
                        })
                    }

                }

                let { accessToken, refreshToken } = this.tokenService.generateToken(existUser, issuer)


                if (existUser.phone) {
                    existUser.phone = await this.securityService.generateDecryption(existUser.phone)
                }

                return { existUser, accessToken, refreshToken }
            }
        }

        throw new BadRequestException("wrong email or password")
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

        // data.password = await this.securityService.generateHash({ planText: data.password })

        let result: HydratedDocument<IUser> = await this.userRepository.create(data)

        if (!result) {
            throw new BadRequestException("user not created")
        }

        // verifyEmailEvent.emit("verifyEmail", { userId: result._id, email: data.email })

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
        const userInfo: HydratedDocument<IUser> = await this.userRepository.findById(userId, '-password', { populate: [{ path: "friends" }] })
        // console.log(userInfo);

        if (!userInfo) {
            throw new NotFoundException("user NOt Found")
        }

        if (userInfo.phone) {
            userInfo.phone = await this.securityService.generateDecryption(userInfo.phone)
        }

        return userInfo

    }

    async profileImage(file: Express.Multer.File, userId: string) {

        const user: HydratedDocument<IUser> = await this.userRepository.findById(userId, '-password')
        // console.log("user", user);
        if (!user) {
            throw new NotFoundException("user NOt Found")
        }
        const oldPic = user.profilePic

        // console.log("file", file);

        const { Key } = await this.s3.uploadLargeAsset({ file, path: `Users/${user.id.toString()}/Profile`, StorageApproach: StorageApproachEnum.DISK, partSize: 5 })

        // console.log("{ Key }", { Key });
        user.profilePic = Key
        await user.save()

        if (oldPic) {
            this.s3.deleteAsset({ Key: oldPic })
        }
        return user.toJSON()
    }

    async profileImageByPreSignedLink({ Originalname, ContentType }: { Originalname: string, ContentType: string }, userId: string): Promise<{ user: IUser, url: string }> {

        const user: HydratedDocument<IUser> = await this.userRepository.findById(userId, '-password')
        // console.log("user", user);

        if (!user) {
            throw new NotFoundException("user NOt Found")
        }

        // const oldPic = user.profilePic

        const { url, key } = await this.s3.createPreSignedUploadLink({ Originalname, ContentType, path: `Users/${user.id.toString()}/Profile` })

        // user.profilePic = key
        // await user.save()

        // if (oldPic) {
        //     this.s3.deleteAsset({ Key: oldPic })
        // }

        return { url, user }
    }

    async profileCoverImages(files: Express.Multer.File[], userId: string) {

        const user: HydratedDocument<IUser> = await this.userRepository.findById(userId, '-password')
        // console.log("user", user);

        if (!user) {
            throw new NotFoundException("user NOt Found")
        }

        const oldUrls = user.profileCoverPic
        // console.log("files", files);

        const urls = await this.s3.uploadAssets({ files, path: `Users/${user.id.toString()}/Profile/cover`, StorageApproach: StorageApproachEnum.DISK, UploadApproach: UploadApproachEnum.LARGE })

        // console.log("urls", urls);
        user.profileCoverPic = urls
        await user.save()

        if (oldUrls?.length) {
            this.s3.deleteAssets({
                Keys: oldUrls.map(fileName => ({ Key: fileName }))
            })
        }

        return user.toJSON()
    }

    async deleteProfile(userId: string) {

        const user: HydratedDocument<IUser> = await this.userRepository.findById(userId, '-password')
        // console.log("user", user);

        if (!user) {
            throw new NotFoundException("user NOt Found")
        }

        const account = await this.userRepository.deleteOne(
            { email: user.email },
        );

        if (!account.deletedCount) {
            throw new NotFoundException("Invalid account");
        }

        await this.s3.deleteFolderByPrefix({
            prefix: `Users/${user._id.toString()}`,
        });

        return account;
    }

    async changePassword(data: changePasswordDto, userId: string) {
        let { password, newPassword } = data


        //get user by id
        const existUser = await this.userRepository.findById(userId)
        if (!existUser) {
            throw new NotFoundException("user not found")
        }


        if (existUser.provider == ProviderEnum.system) {

            if (!password) {
                throw new BadRequestException("old password is required")
            }

            //compare old pass
            let isMatched = await this.securityService.compareHash({ planText: password, cypherText: existUser.password })
            if (!isMatched) {
                throw new BadRequestException("wrong password")
            }

        }


        //hash new pass
        newPassword = await this.securityService.generateHash({ planText: newPassword })


        //set new pass in database 
        const user = await this.userRepository.updateOne({ email: existUser.email }, { password: newPassword, provider: ProviderEnum.system })
        return user


    }
}

export default new authService()
