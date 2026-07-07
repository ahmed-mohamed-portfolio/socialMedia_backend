import { hash, compare } from "bcrypt"
import { SALT } from "../../config/env.service"

export class SecurityService {
    constructor() {}

    generateHash = async ({ planText, Salt = SALT }: { planText: string; Salt?: string }): Promise<string> => {
        let hashedPassword = await hash(planText, Number(Salt))
        return hashedPassword
    }

    compareHash = async ({ planText, cypherText }: { planText: string; cypherText: string }): Promise<boolean> => {
        let isMatched = await compare(planText, cypherText)
        return isMatched
    }
}
