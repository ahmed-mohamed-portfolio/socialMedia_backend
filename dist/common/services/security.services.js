"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const bcrypt_1 = require("bcrypt");
const env_service_1 = require("../../config/env.service");
class SecurityService {
    constructor() { }
    generateHash = async ({ planText, Salt = env_service_1.SALT }) => {
        let hashedPassword = await (0, bcrypt_1.hash)(planText, Number(Salt));
        return hashedPassword;
    };
    compareHash = async ({ planText, cypherText }) => {
        let isMatched = await (0, bcrypt_1.compare)(planText, cypherText);
        return isMatched;
    };
}
exports.SecurityService = SecurityService;
