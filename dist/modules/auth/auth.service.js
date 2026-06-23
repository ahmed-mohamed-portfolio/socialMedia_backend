"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const application_exceptions_1 = require("../../common/exceptions/application.exceptions");
class authService {
    constructor() {
    }
    login(data) {
        throw new application_exceptions_1.AplicationException();
    }
}
exports.default = new authService;
