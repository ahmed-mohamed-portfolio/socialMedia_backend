"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = void 0;
const express_1 = __importDefault(require("express"));
const modules_1 = require("./modules");
const cors_1 = __importDefault(require("cors"));
const error_middleware_1 = require("./middleware/error.middleware");
const env_service_1 = require("./config/env.service");
const connection_1 = __importDefault(require("./database/connection"));
const bootstrap = async () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)(), express_1.default.json());
    await (0, connection_1.default)();
    app.use('/auth', modules_1.authRouter);
    app.use(error_middleware_1.globalErrorHandler);
    app.listen(env_service_1.PORT, () => {
        console.log(`server run in port ${env_service_1.PORT}`);
    });
};
exports.bootstrap = bootstrap;
