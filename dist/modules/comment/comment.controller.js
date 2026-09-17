"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const multer_1 = require("../../common/utils/multer");
const success_response_1 = require("../../common/exceptions/success.response");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const comment_service_1 = require("./comment.service");
const comment_validation_1 = require("./comment.validation");
const router = (0, express_1.Router)({ mergeParams: true });
router.post('/', auth_middleware_1.authentication, (0, multer_1.cloudeFileUpload)({ validation: multer_1.fileFieldValidation.image, maxSize: 20 }).array("attachments", 2), (0, validation_middleware_1.validation)(comment_validation_1.createCommentSchema), async (req, res, next) => {
    // console.log("req", req);
    let data = await comment_service_1.commentService.createComment(req.params, { ...req.body, files: req.files }, req.user);
    console.log(data);
    return (0, success_response_1.SuccessResponse)({ res, status: 201, data });
});
router.post('/:commentId/reply', auth_middleware_1.authentication, (0, multer_1.cloudeFileUpload)({ validation: multer_1.fileFieldValidation.image, maxSize: 20 }).array("attachments", 2), (0, validation_middleware_1.validation)(comment_validation_1.createReplyOnCommentSchema), async (req, res, next) => {
    // console.log("req", req);
    let data = await comment_service_1.commentService.replyOnComment(req.params, { ...req.body, files: req.files }, req.user);
    return (0, success_response_1.SuccessResponse)({ res, status: 201, data });
});
router.put('/:commentId', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(comment_validation_1.updateCommentSchema), async (req, res, next) => {
    console.log("req.body", req.body);
    const data = await comment_service_1.commentService.updateComment(req.params, req.body, req.user);
    return (0, success_response_1.SuccessResponse)({ res, status: 200, data });
});
router.delete('/:commentId', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(comment_validation_1.deleteCommentSchema), async (req, res, next) => {
    const data = await comment_service_1.commentService.deleteComment(req.params, req.user);
    return (0, success_response_1.SuccessResponse)({ res, status: 200, data });
});
exports.default = router;
