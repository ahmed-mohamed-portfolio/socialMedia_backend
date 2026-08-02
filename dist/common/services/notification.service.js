"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
class NotificationService {
    constructor() {
        //BUILD_Connection
        const serviceAccount = JSON.parse(fs_1.default.readFileSync((0, path_1.resolve)(process.cwd(), "src/config/sendtestnotification-ee4ea-firebase-adminsdk-fbsvc-e2a3d52687.json"), "utf8"));
        (0, app_1.initializeApp)({
            credential: (0, app_1.cert)(serviceAccount),
        });
    }
    sendNotificationToToken = async ({ token, data }) => {
        const message = {
            token,
            data,
        };
        return await (0, messaging_1.getMessaging)().send(message);
    };
    sendNotificationToTokens = async ({ tokens, data }) => {
        await Promise.allSettled(tokens.map((token => {
            return this.sendNotificationToToken({
                token,
                data
            });
        })));
    };
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
