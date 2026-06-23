

export class AplicationException extends Error {
    constructor(message: string, public status: number, cause?: unknown) {
        super(message, { cause })
    }


}