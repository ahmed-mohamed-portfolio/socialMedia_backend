"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const bcrypt_1 = require("bcrypt");
const env_service_1 = require("../../config/env.service");
const application_exceptions_1 = require("../exceptions/application.exceptions");
const node_crypto_1 = __importDefault(require("node:crypto"));
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
    generateEncryption = async (plaintext) => {
        const iv = node_crypto_1.default.randomBytes(env_service_1.ENC_IV_LENGTH);
        const cipherIvVector = node_crypto_1.default.createCipheriv('aes-256-cbc', env_service_1.ENC_KEY, iv);
        let cipherText = cipherIvVector.update(plaintext, 'utf-8', 'hex');
        cipherText += cipherIvVector.final('hex');
        // console.log({ iv, cipherIvVector, cipherText, ivv: iv.toString('hex') });
        return `${iv.toString('hex')}:${cipherText}`;
    };
    generateDecryption = async (cipherText) => {
        const [iv, encryption] = cipherText.split(":") || [];
        if (!iv || !encryption) {
            throw new application_exceptions_1.BadRequestException("Invalid encryption parts");
        }
        const ivLikeBinary = Buffer.from(iv, 'hex');
        // console.log({ iv, ivLikeBinary, encryption });
        const deCipherIvVector = node_crypto_1.default.createDecipheriv('aes-256-cbc', env_service_1.ENC_KEY, ivLikeBinary);
        let plaintext = deCipherIvVector.update(encryption, 'hex', 'utf-8');
        plaintext += deCipherIvVector.final('utf-8');
        return plaintext;
    };
}
exports.SecurityService = SecurityService;
