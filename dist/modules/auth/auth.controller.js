"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = __importDefault(require("./auth.service"));
const success_response_1 = require("../../common/exceptions/success.response");
const router = (0, express_1.Router)();
router.post('/login', (req, res) => {
    let loginData = auth_service_1.default.login(req.body);
    (0, success_response_1.SuccessResponse)({ res, data: loginData });
});
exports.default = router;
