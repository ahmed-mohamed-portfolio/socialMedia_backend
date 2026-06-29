"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const application_exceptions_1 = require("./../../common/exceptions/application.exceptions");
const user_model_1 = __importDefault(require("../../database/model/user.model"));
const application_exceptions_2 = require("../../common/exceptions/application.exceptions");
const base_repository_1 = require("../../database/repository/base.repository");
class authService {
    userModel;
    userRepository;
    constructor() {
        this.userModel = user_model_1.default;
        this.userRepository = new base_repository_1.DatabaseRepository(this.userModel);
    }
    async signin(data) {
        let result = await this.userRepository.findone({ email: data.email, password: data.password });
        if (!result) {
            throw new application_exceptions_1.NotFoundException("user not found");
        }
        return result;
    }
    async signup(data) {
        let result = await this.userRepository.create(data);
        if (!result) {
            throw new application_exceptions_2.BadRequestException("user not created");
        }
        return result.toJSON();
    }
}
exports.default = new authService;
