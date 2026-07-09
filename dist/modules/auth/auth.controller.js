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
router.post("/signin", (0, validation_middleware_1.validation)(auth_validation_1.signinSchema), async (req, res) => {
    let data = await auth_service_1.default.signin(req.body);
    (0, success_response_1.SuccessResponse)({ res, message: "signin success", data });
});
router.post("/signup", (0, validation_middleware_1.validation)(auth_validation_1.signupSchema), async (req, res) => {
    let data = await auth_service_1.default.signup(req.body);
    (0, success_response_1.SuccessResponse)({ res, message: "signup success", data });
});
router.post("/verify", (0, validation_middleware_1.validation)(auth_validation_1.verifySchema), async (req, res) => {
    let data = await auth_service_1.default.verifyEmail(req.body);
    return (0, success_response_1.SuccessResponse)({ res, message: "email verified", status: 200, data });
});
exports.default = router;
