"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SALT = exports.MONGODB_URL = exports.PORT = void 0;
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
(0, dotenv_1.config)({ path: path_1.default.resolve(`./.env.${process.env.NODE_ENV}`) });
let PORT = process.env.SERVER_PORT;
exports.PORT = PORT;
let MONGODB_URL = process.env.MONGODB_URL;
exports.MONGODB_URL = MONGODB_URL;
// let PROJ_MOOD = process.env.MOOD
let SALT = process.env.SALT;
exports.SALT = SALT;
