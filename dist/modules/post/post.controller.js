"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const multer_1 = require("../../common/utils/multer");
const success_response_1 = require("../../common/exceptions/success.response");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const post_validation_1 = require("./post.validation");
const post_service_1 = require("./post.service");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authentication, async (req, res, next) => {
    // console.log("req", req);
    let data = await post_service_1.postService.postList(req.user);
    return (0, success_response_1.SuccessResponse)({ res, status: 201, data });
});
router.post('/', auth_middleware_1.authentication, (0, multer_1.cloudeFileUpload)({ validation: multer_1.fileFieldValidation.image, maxSize: 20 }).array("attachments", 2), (0, validation_middleware_1.validation)(post_validation_1.createPostSchema), async (req, res, next) => {
    // console.log("req", req);
    let data = await post_service_1.postService.createPost({ ...req.body, files: req.files }, req.user);
    return (0, success_response_1.SuccessResponse)({ res, status: 201, data });
});
exports.default = router;
