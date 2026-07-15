"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
class authService {
    userModel;
    userRepository;
    securityService;
    tokenService;
    constructor() {
        this.userModel = user_model_1.default;
        this.userRepository = new base_repository_1.DatabaseRepository(this.userModel);
        this.securityService = new security_services_1.SecurityService();
        this.tokenService = new token_service_1.TokenService();
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
    async login(data, issuer) {
        let { email, password } = data;
        let existUser = await this.userRepository.findOne({ email, provider: 0 /* ProviderEnum.system */ });
        console.log("existUser", existUser);
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
        const user = await this.userRepository.findOne({ email: payload.email, provider: 1 /* ProviderEnum.google */ });
        if (!user) {
            throw new application_exceptions_1.NotFoundException("not registered account");
        }
        let { accessToken, refreshToken } = this.tokenService.generateToken(user, issuer);
        let data = { user, accessToken, refreshToken };
        return { message: "user logged in successfully", status: 200, data };
    }
    signupWithGmail = async (idToken, issuer) => {
        const payload = await this.VerifyGoogleAccount(idToken);
        console.log("payload", payload);
        if (!payload) {
            throw new application_exceptions_2.BadRequestException("bad payload");
        }
        const checkExist = await this.userRepository.findOne({ email: payload.email });
        if (checkExist) {
            if (checkExist.provider == 0 /* ProviderEnum.system */) {
                throw new application_exceptions_1.ConflictException("invalid login porvider");
            }
            return this.loginWithGmail(idToken, issuer);
        }
        const user = await this.userRepository.insertOne({
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
}
exports.default = new authService();
