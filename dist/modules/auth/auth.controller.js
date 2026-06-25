"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = __importDefault(require("./auth.service"));
const success_response_1 = require("../../common/exceptions/success.response");
const auth_validation_1 = require("./auth.validation");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const router = (0, express_1.Router)();
router.post('/login', (req, res) => {
    let loginData = auth_service_1.default.login(req.body);
    (0, success_response_1.SuccessResponse)({ res, data: loginData });
});
router.post('/signup', (0, validation_middleware_1.validation)(auth_validation_1.signupSchema), (req, res) => {
    (0, success_response_1.SuccessResponse)({ res, data: req.body });
});
exports.default = router;
