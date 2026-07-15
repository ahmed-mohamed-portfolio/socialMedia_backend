"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = exports.authentication = void 0;
const redis_service_1 = require("./../common/services/redis.service");
const application_exceptions_1 = require("../common/exceptions/application.exceptions");
const token_service_1 = require("../common/services/token.service");
const base_repository_1 = require("../database/repository/base.repository");
const user_model_1 = __importDefault(require("../database/model/user.model"));
const tokenService = new token_service_1.TokenService();
const userRepository = new base_repository_1.DatabaseRepository(user_model_1.default);
const authentication = async (req, res, next) => {
    console.log("!req.cookies.accessToken!req.cookies.accessToken", req.cookies.accessToken);
    if (!req.cookies.accessToken) {
        throw new application_exceptions_1.UnauthorizedException("un authorized");
    }
    let decodedData = tokenService.decodeToken(req.cookies.accessToken);
    if (!decodedData.iat || !decodedData.id || !decodedData.jti) {
        throw new application_exceptions_1.BadRequestException('bad decodedData');
    }
    let user = await userRepository.findById(decodedData.id);
    if (Math.floor(new Date(user.credentialsUpdatedAt).getTime() / 1000) > decodedData.iat) {
        throw new application_exceptions_1.BadRequestException('invalid token22');
    }
    req.userId = decodedData.id;
    req.jti = decodedData.jti;
    let blocked_Token = await redis_service_1.redisService.get(`RevokeToken::${req.userId}::${req.jti}`);
    if (blocked_Token) {
        throw new application_exceptions_1.BadRequestException('invalid token (blocked 1)');
    }
    next();
};
exports.authentication = authentication;
//!!! i need to complete it
const authorization = (req, res, next) => {
    next();
};
exports.authorization = authorization;
