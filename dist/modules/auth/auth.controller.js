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
const application_exceptions_1 = require("../../common/exceptions/application.exceptions");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const multer_1 = require("../../common/utils/multer");
const enums_1 = require("../../common/enums");
const router = (0, express_1.Router)();
router.post("/signin", (0, validation_middleware_1.validation)(auth_validation_1.signinSchema), async (req, res) => {
    let host = `${req.protocol}://${req.host}`;
    let data = await auth_service_1.default.login(req.body, host);
    res.cookie("refreshToken", data.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/"
    });
    res.cookie("accessToken", data.accessToken, {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        path: "/"
    });
    (0, success_response_1.SuccessResponse)({ res, message: "signin success", data });
});
router.post("/signup", (0, validation_middleware_1.validation)(auth_validation_1.signupSchema), async (req, res) => {
    let data = await auth_service_1.default.signup(req.body);
    (0, success_response_1.SuccessResponse)({ res, message: "success", data });
});
router.post("/verify", (0, validation_middleware_1.validation)(auth_validation_1.verifySchema), async (req, res) => {
    let data = await auth_service_1.default.verifyEmail(req.body);
    return (0, success_response_1.SuccessResponse)({ res, message: "email verified", status: 200, data });
});
const getCookieValue = (req, key) => {
    const cookies = req.headers.cookie;
    if (!cookies) {
        return null;
    }
    for (const cookie of cookies.split(";")) {
        const [cookieKey, ...cookieValueParts] = cookie.trim().split("=");
        if (cookieKey === key) {
            return decodeURIComponent(cookieValueParts.join("="));
        }
    }
    return null;
};
router.post("/signup/gmail", async (req, res) => {
    //? i used this email ==> ahmed.mohamed.connect@gmail.com
    //req.headers.cookie ==> this dont work till front and back in same domain or local host
    const csrfCookie = getCookieValue(req, "g_csrf_token");
    const csrfBody = req.body?.g_csrf_token;
    if (!csrfCookie || !csrfBody || csrfCookie !== csrfBody) {
        throw new application_exceptions_1.ConflictException("Invalid Google CSRF token");
    }
    let host = `${req.protocol}://${req.host}`;
    let { message, status, data } = await auth_service_1.default.signupWithGmail(req.body.credential, host);
    // if success
    res.cookie("refreshToken", data.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/"
    });
    res.cookie("accessToken", data.accessToken, {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        path: "/"
    });
    return res.redirect("http://localhost:4200/timeLine");
});
router.patch("/logout-from-all-devices", auth_middleware_1.authentication, async (req, res) => {
    await auth_service_1.default.logOutFromAllDevices(req.userId);
    res.clearCookie("accessToken", {
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
        path: "/"
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: "/"
    });
    return (0, success_response_1.SuccessResponse)({ res, message: 'logged out from all devices successfully', status: 200 });
});
router.post("/logout", auth_middleware_1.authentication, async (req, res) => {
    await auth_service_1.default.logOut(req.userId, req.jti);
    res.clearCookie("accessToken", {
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
        path: "/"
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: "/"
    });
    return (0, success_response_1.SuccessResponse)({ res, message: 'logged out successfully', status: 200 });
});
router.get('/generate-access-token', async (req, res) => {
    // console.log("i am here generate-access-tokengenerate-access-token");
    // console.log("req.cookies.refreshTokenreq.cookies.refreshToken", req.cookies.refreshToken);
    let accessToken = await auth_service_1.default.generateAccessToken(req.cookies.refreshToken);
    res.cookie("accessToken", accessToken, {
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
        path: "/"
    });
    return (0, success_response_1.SuccessResponse)({ res, message: 'access token created', status: 200, });
});
router.get('/get-user-profile', auth_middleware_1.authentication, async (req, res) => {
    console.log("req.userId", req.userId);
    let userData = await auth_service_1.default.getUserProfile(req.userId);
    if (!userData) {
        throw new application_exceptions_1.BadRequestException("cant get user");
    }
    (0, success_response_1.SuccessResponse)({ res, message: "done", status: 200, data: userData });
});
router.patch('/profile-image', auth_middleware_1.authentication, (0, multer_1.cloudeFileUpload)({ StorageApproach: enums_1.StorageApproachEnum.DISK, validation: multer_1.fileFieldValidation.image, maxSize: 200 }).single("attachment"), async (req, res) => {
    let userData = await auth_service_1.default.profileImage(req.file, req.userId);
    if (!userData) {
        throw new application_exceptions_1.BadRequestException("cant uploade image");
    }
    (0, success_response_1.SuccessResponse)({ res, data: userData });
});
router.patch('/profile-image-byPreSignedLink', auth_middleware_1.authentication, async (req, res) => {
    let userData = await auth_service_1.default.profileImageByPreSignedLink(req.body, req.userId);
    if (!userData) {
        throw new application_exceptions_1.BadRequestException("cant get preSignedLink");
    }
    (0, success_response_1.SuccessResponse)({ res, data: userData });
});
router.patch('/profile-cover-images', auth_middleware_1.authentication, (0, multer_1.cloudeFileUpload)({ StorageApproach: enums_1.StorageApproachEnum.DISK, validation: multer_1.fileFieldValidation.image, maxSize: 20 }).array("attachments", 2), async (req, res) => {
    console.log("req.files", req.files);
    let userData = await auth_service_1.default.profileCoverImages(req.files, req.userId);
    if (!userData) {
        throw new application_exceptions_1.BadRequestException("cant uploade images");
    }
    (0, success_response_1.SuccessResponse)({ res, data: userData });
});
router.delete("/delete-profile", auth_middleware_1.authentication, async (req, res) => {
    const data = await auth_service_1.default.deleteProfile(req.userId);
    return (0, success_response_1.SuccessResponse)({ res, data });
});
exports.default = router;
