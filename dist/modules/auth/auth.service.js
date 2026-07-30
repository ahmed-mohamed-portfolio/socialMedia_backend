"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_enum_1 = require("./../../common/enums/multer.enum");
const base_repository_1 = require("./../../database/repository/base.repository");
const security_services_1 = require("./../../common/services/security.services");
const application_exceptions_1 = require("./../../common/exceptions/application.exceptions");
const application_exceptions_2 = require("../../common/exceptions/application.exceptions");
const email_events_1 = require("../../common/utils/email/email.events");
const redis_service_1 = require("../../common/services/redis.service");
const user_model_1 = __importDefault(require("../../database/model/user.model"));
const token_service_1 = require("../../common/services/token.service");
const google_auth_library_1 = require("google-auth-library");
const env_service_1 = require("./../../config/env.service");
const node_crypto_1 = __importDefault(require("node:crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const s3_service_1 = require("../../common/services/s3.service");
class authService {
    userModel;
    userRepository;
    securityService;
    tokenService;
    s3;
    constructor() {
        this.userModel = user_model_1.default;
        this.userRepository = new base_repository_1.DatabaseRepository(this.userModel);
        this.securityService = new security_services_1.SecurityService();
        this.tokenService = new token_service_1.TokenService();
        this.s3 = s3_service_1.s3Service;
    }
    async login(data, issuer) {
        let { email, password } = data;
        let existUser = await this.userRepository.findOne({ email });
        // console.log("existUser", existUser)
        // if (!existUser.confirmEmail) {
        //     throw new BadRequestException("email not confirmed")
        // }
        if (existUser) {
            let isMatched = await this.securityService.compareHash({ planText: password, cypherText: existUser.password });
            if (isMatched) {
                let { accessToken, refreshToken } = this.tokenService.generateToken(existUser, issuer);
                return { existUser, accessToken, refreshToken };
            }
        }
        throw new application_exceptions_1.NotFoundException("user not found");
    }
    async signup(data) {
        const existuser = await this.userRepository.findOne({ email: data.email });
        if (existuser) {
            throw new application_exceptions_2.BadRequestException("email already signed before");
        }
        const user = await this.userRepository.findOne({ email: data.email, provider: 0 /* ProviderEnum.system */ });
        if (user && user.confirmEmail == false) {
            email_events_1.verifyEmailEvent.emit("verifyEmail", { userId: user._id, email: data.email });
            return user.toJSON();
        }
        data.password = await this.securityService.generateHash({ planText: data.password });
        let result = await this.userRepository.create(data);
        if (!result) {
            throw new application_exceptions_2.BadRequestException("user not created");
        }
        email_events_1.verifyEmailEvent.emit("verifyEmail", { userId: result._id, email: data.email });
        return result.toJSON();
    }
    async verifyEmail(data) {
        let { email, code } = data;
        let user = await this.userRepository.findOne({ email });
        if (!user) {
            throw new application_exceptions_1.NotFoundException("email not found");
        }
        if (user.confirmEmail) {
            throw new application_exceptions_1.ConflictException("email already verified");
        }
        let redisCode = await redis_service_1.redisService.get(`OTP::${user._id}`);
        if (!redisCode) {
            throw new application_exceptions_1.NotFoundException("code not found or expired");
        }
        if (await this.securityService.compareHash({ planText: code, cypherText: redisCode })) {
            let userData = await this.userRepository.findByIdAndUpdate(user._id, { confirmEmail: true }, "-password", { new: true });
            if (userData) {
                await redis_service_1.redisService.deleteKey(`OTP::${user._id}`);
            }
            return userData;
        }
        throw new application_exceptions_2.BadRequestException("code not right");
    }
    async VerifyGoogleAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            /*
               https://console.cloud.google.com/auth/clients?project=c45learnloginbygmail&pli=1
            */
            audience: env_service_1.gmail_client_id
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw new application_exceptions_2.BadRequestException("bad payload");
        }
        if (!payload.email_verified) {
            throw new application_exceptions_2.BadRequestException("fail to verify by google");
        }
        return payload;
    }
    async loginWithGmail(idToken, issuer) {
        const payload = await this.VerifyGoogleAccount(idToken);
        const user = await this.userRepository.findOne({ email: payload.email });
        // console.log("user", user);
        if (!user) {
            throw new application_exceptions_1.NotFoundException("not registered account");
        }
        if (!user.confirmEmail) {
            throw new application_exceptions_2.BadRequestException("email not confirmed");
        }
        let { accessToken, refreshToken } = this.tokenService.generateToken(user, issuer);
        let data = { user, accessToken, refreshToken };
        return { message: "user logged in successfully", status: 200, data };
    }
    signupWithGmail = async (idToken, issuer) => {
        const payload = await this.VerifyGoogleAccount(idToken);
        // console.log("payload", payload);
        if (!payload.email) {
            throw new application_exceptions_2.BadRequestException("Google account has no email");
        }
        const checkExist = await this.userRepository.findOne({ email: payload.email });
        if (checkExist) {
            if (checkExist.provider == 0 /* ProviderEnum.system */ && checkExist.confirmEmail == false) {
                await this.userRepository.findOneAndUpdate({ email: payload.email }, { confirmEmail: true });
            }
            return this.loginWithGmail(idToken, issuer);
        }
        const user = await this.userRepository.create({
            firstName: payload.given_name,
            lastName: payload.family_name,
            email: payload.email,
            profilePic: payload.picture,
            confirmEmail: true,
            provider: 1 /* ProviderEnum.google */,
            role: 1 /* RoleEnum.user */
        });
        let { accessToken, refreshToken } = this.tokenService.generateToken(user, issuer);
        let data = { user, accessToken, refreshToken };
        return { message: "user added", status: 201, data };
    };
    async logOutFromAllDevices(userId) {
        let user = await this.userRepository.findByIdAndUpdate(userId, { credentialsUpdatedAt: new Date() }, '_id');
        //THIS IS A saver way =>  // await deleteByPattern(`RevokeToken::${userId}::`)
        await redis_service_1.redisService.deleteKey(await redis_service_1.redisService.keys(`RevokeToken::${userId}::`));
        if (!user) {
            throw new application_exceptions_1.NotFoundException("user not found");
        }
        return true;
    }
    async logOut(userId, jti) {
        let addToken = await redis_service_1.redisService.set({
            key: `RevokeToken::${userId}::${jti}`,
            value: jti,
            ttl: 31536000
        });
        if (!addToken) {
            throw new application_exceptions_2.BadRequestException("cant add token");
        }
        return addToken;
    }
    async generateAccessToken(token) {
        let decodedData = await this.tokenService.decodeRefreshToken(token);
        let signature = undefined;
        switch (decodedData.aud) {
            case "Admin":
                signature = env_service_1.jwt_admin_signature;
                break;
            case "User":
                signature = env_service_1.jwt_user_signature;
                break;
        }
        let jwtid = node_crypto_1.default.randomBytes(10).toString("hex");
        if (!signature) {
            throw new application_exceptions_2.BadRequestException("bad signature");
        }
        let accessToken = jsonwebtoken_1.default.sign({ id: decodedData.id, firstName: decodedData.firstName, lastName: decodedData.lastName, email: decodedData.email }, signature, {
            expiresIn: '1m',
            audience: decodedData.aud,
            jwtid
        });
        return accessToken;
    }
    async getUserProfile(userId) {
        const userInfo = await this.userRepository.findById(userId, '-password');
        console.log(userInfo);
        if (!userInfo) {
            throw new application_exceptions_1.NotFoundException("user NOt Found");
        }
        return userInfo;
    }
    async profileImage(file, userId) {
        const user = await this.userRepository.findById(userId, '-password');
        console.log("user", user);
        if (!user) {
            throw new application_exceptions_1.NotFoundException("user NOt Found");
        }
        const oldPic = user.profilePic;
        console.log("file", file);
        const { Key } = await this.s3.uploadLargeAsset({ file, path: `Users/${user.id.toString()}/Profile`, StorageApproach: multer_enum_1.StorageApproachEnum.DISK, partSize: 5 });
        console.log("{ Key }", { Key });
        user.profilePic = Key;
        await user.save();
        if (oldPic) {
            this.s3.deleteAsset({ Key: oldPic });
        }
        return user.toJSON();
    }
    async profileImageByPreSignedLink({ Originalname, ContentType }, userId) {
        const user = await this.userRepository.findById(userId, '-password');
        console.log("user", user);
        if (!user) {
            throw new application_exceptions_1.NotFoundException("user NOt Found");
        }
        const oldPic = user.profilePic;
        const { url, key } = await this.s3.createPreSignedUploadLink({ Originalname, ContentType, path: `Users/${user.id.toString()}/Profile` });
        console.log("{ Key }", { key });
        console.log("{ url }", { url });
        user.profilePic = key;
        await user.save();
        if (oldPic) {
            this.s3.deleteAsset({ Key: oldPic });
        }
        return { url, user };
    }
    async profileCoverImages(files, userId) {
        const user = await this.userRepository.findById(userId, '-password');
        console.log("user", user);
        if (!user) {
            throw new application_exceptions_1.NotFoundException("user NOt Found");
        }
        console.log("files", files);
        const urls = await this.s3.uploadAssets({ files, path: `Users/${user.id.toString()}/Profile/cover`, StorageApproach: multer_enum_1.StorageApproachEnum.DISK, UploadApproach: multer_enum_1.UploadApproachEnum.LARGE });
        console.log("urls", urls);
        user.profileCoverPic = urls;
        await user.save();
        return user.toJSON();
    }
}
exports.default = new authService();
