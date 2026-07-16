"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const application_exceptions_1 = require("../exceptions/application.exceptions");
const index_1 = require("../../config/index");
const base_repository_1 = require("../../database/repository/base.repository");
const user_model_1 = __importDefault(require("../../database/model/user.model"));
const redis_service_1 = require("./redis.service");
class TokenService {
    userModel;
    userRepository;
    constructor() {
        this.userModel = user_model_1.default;
        this.userRepository = new base_repository_1.DatabaseRepository(this.userModel);
    }
    generateToken(existUser, issuer) {
        let audience = undefined;
        let signature = undefined;
        let refreshSignature = undefined;
        switch (existUser.role) {
            case 0 /* RoleEnum.admin */:
                signature = index_1.jwt_admin_signature;
                refreshSignature = index_1.jwt_admin_refresh_signature;
                audience = "Admin";
                break;
            case 1 /* RoleEnum.user */:
                signature = index_1.jwt_user_signature;
                refreshSignature = index_1.jwt_user_refresh_signature;
                audience = "User";
                break;
        }
        let jwtid = node_crypto_1.default.randomBytes(10).toString("hex");
        if (!signature) {
            throw new application_exceptions_1.BadRequestException("bad signature");
        }
        //!i put it for test 1m
        let accessToken = jsonwebtoken_1.default.sign({ id: existUser._id, firstName: existUser.firstName, lastName: existUser.lastName, email: existUser.email }, signature, {
            expiresIn: "1m",
            issuer,
            audience,
            jwtid
        });
        if (!refreshSignature) {
            throw new application_exceptions_1.BadRequestException("bad signature");
        }
        let refreshToken = jsonwebtoken_1.default.sign({ id: existUser._id, firstName: existUser.firstName, lastName: existUser.lastName, email: existUser.email }, refreshSignature, {
            expiresIn: "1y",
            audience,
            jwtid
        });
        return { accessToken, refreshToken };
    }
    decodeToken(token) {
        let decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded) {
            throw new application_exceptions_1.BadRequestException("invalid decoded");
        }
        let signature = undefined;
        switch (decoded.aud) {
            case "Admin":
                signature = index_1.jwt_admin_signature;
                break;
            default:
                signature = index_1.jwt_user_signature;
                break;
        }
        let decodedData = jsonwebtoken_1.default.verify(token, signature);
        return decodedData;
    }
    async decodeRefreshToken(token) {
        const splitToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
        let decoded = jsonwebtoken_1.default.decode(splitToken);
        let refreshSignature = undefined;
        if (!decoded) {
            throw new application_exceptions_1.BadRequestException("invalid token");
        }
        switch (decoded.aud) {
            case "Admin":
                refreshSignature = index_1.jwt_admin_refresh_signature;
                break;
            default:
                refreshSignature = index_1.jwt_user_refresh_signature;
                break;
        }
        let decodedData = jsonwebtoken_1.default.verify(token, refreshSignature);
        let user = await this.userRepository.findById(decodedData.id);
        if (!decodedData.iat) {
            throw new application_exceptions_1.BadRequestException("no decodedData.iat");
        }
        if (Math.floor(new Date(user.credentialsUpdatedAt).getTime() / 1000) > decodedData.iat) {
            throw new application_exceptions_1.BadRequestException("invalid token2211");
        }
        let blocked_Token = await redis_service_1.redisService.get(`RevokeToken::${decodedData.id}::${decodedData.jti}`);
        if (blocked_Token !== null) {
            throw new application_exceptions_1.BadRequestException("invalid token (blocked 2)");
        }
        return decodedData;
    }
}
exports.TokenService = TokenService;
