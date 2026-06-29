"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = __importDefault(require("../../database/model/user.model"));
const application_exceptions_1 = require("../../common/exceptions/application.exceptions");
class authService {
    userModel;
    constructor() {
        this.userModel = user_model_1.default;
    }
    async signup(data) {
        let result = await this.userModel.create(data);
        if (!result) {
            throw new application_exceptions_1.BadRequestException("user not created");
        }
        return result.toJSON();
    }
}
exports.default = new authService;
