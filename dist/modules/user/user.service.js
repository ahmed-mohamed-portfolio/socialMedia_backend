"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = __importDefault(require("../../database/model/user.model"));
const base_repository_1 = require("../../database/repository/base.repository");
class userService {
    userRepository;
    constructor() {
        this.userRepository = new base_repository_1.DatabaseRepository(user_model_1.default);
    }
}
exports.default = new userService();
