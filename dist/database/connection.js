"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_service_1 = require("../config/env.service");
const DBconnection = async () => {
    await mongoose_1.default.connect(env_service_1.MONGODB_URL).then(() => console.log("MongoDB database connected"))
        .catch((err) => console.log(err));
};
exports.default = DBconnection;
