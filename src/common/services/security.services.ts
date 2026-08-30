import { hash, compare } from "bcrypt"
import { ENC_IV_LENGTH, ENC_KEY, SALT } from "../../config/env.service"
import { BadRequestException } from "../exceptions/application.exceptions";
import crypto from 'node:crypto';

export class SecurityService {
    constructor() { }

    generateHash = async ({ planText, Salt = SALT }: { planText: string; Salt?: string }): Promise<string> => {
        let hashedPassword = await hash(planText, Number(Salt))
        return hashedPassword
    }

    compareHash = async ({ planText, cypherText }: { planText: string; cypherText: string }): Promise<boolean> => {
        let isMatched = await compare(planText, cypherText)
        return isMatched
    }

    generateEncryption = async (plaintext: string): Promise<string> => {

        const iv = crypto.randomBytes(ENC_IV_LENGTH)
        const cipherIvVector = crypto.createCipheriv('aes-256-cbc', ENC_KEY, iv);

        let cipherText = cipherIvVector.update(plaintext, 'utf-8', 'hex')
        cipherText += cipherIvVector.final('hex')
        // console.log({ iv, cipherIvVector, cipherText, ivv: iv.toString('hex') });
        return `${iv.toString('hex')}:${cipherText}`
    }

    generateDecryption = async (cipherText: string): Promise<string> => {
        const [iv, encryption] = cipherText.split(":") || [] as string[]
        if (!iv || !encryption) {
            throw new BadRequestException("Invalid encryption parts")
        }

        const ivLikeBinary = Buffer.from(iv, 'hex')
        // console.log({ iv, ivLikeBinary, encryption });

        const deCipherIvVector = crypto.createDecipheriv('aes-256-cbc', ENC_KEY, ivLikeBinary);
        let plaintext = deCipherIvVector.update(encryption, 'hex', 'utf-8');
        plaintext += deCipherIvVector.final('utf-8');
        return plaintext
    }
}
