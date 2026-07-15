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
const redis_service_1 = require("./common/services/redis.service");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const bootstrap = async () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cookie_parser_1.default)());
    app.use((0, cors_1.default)({
        origin: [
            "http://localhost:4200",
        ],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization",]
    }));
    app.use("/users", modules_1.authRouter);
    await redis_service_1.redisService.connect();
    await (0, connection_1.default)();
    app.get("/get-cookie", (req, res) => {
        if (req.cookies.accessToken) {
            return res.json({ auth: true });
        }
        else {
            return res.json({ auth: false });
        }
    });
    app.use(error_middleware_1.globalErrorHandler);
    app.listen(env_service_1.PORT, () => {
        console.log(`server run in port ${env_service_1.PORT}`);
    });
};
exports.bootstrap = bootstrap;
