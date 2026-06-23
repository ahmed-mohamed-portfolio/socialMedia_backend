"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AplicationException = void 0;
class AplicationException extends Error {
    status;
    constructor(message, status, cause) {
        super(message, { cause });
        this.status = status;
    }
}
exports.AplicationException = AplicationException;
