"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const security_services_1 = require("./../../common/services/security.services");
const application_exceptions_1 = require("./../../common/exceptions/application.exceptions");
const user_model_1 = __importDefault(require("../../database/model/user.model"));
const application_exceptions_2 = require("../../common/exceptions/application.exceptions");
const base_repository_1 = require("../../database/repository/base.repository");
const email_events_1 = require("../../common/utils/email/email.events");
class authService {
    userModel;
    userRepository;
    securityService;
    constructor() {
        this.userModel = user_model_1.default;
        this.userRepository = new base_repository_1.DatabaseRepository(this.userModel);
        this.securityService = new security_services_1.SecurityService();
    }
    async signin(data) {
        let result = await this.userRepository.findone({ email: data.email });
        if (!result) {
            throw new application_exceptions_1.NotFoundException("user not found");
        }
        let matchedPassword = await this.securityService.compareHash({ planText: data.password, cypherText: result.password });
        if (!matchedPassword) {
            throw new application_exceptions_2.BadRequestException("wrong password");
        }
        return result;
    }
    async signup(data) {
        console.log(data);
        data.password = await this.securityService.generateHash({ planText: data.password });
        let result = await this.userRepository.create(data);
        if (!result) {
            throw new application_exceptions_2.BadRequestException("user not created");
        }
        email_events_1.event.emit("verifyEmail", { userId: result._id, email: data.email });
        return result.toJSON();
    }
}
exports.default = new authService();
