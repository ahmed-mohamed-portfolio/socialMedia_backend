"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileFilter = exports.fileFieldValidation = void 0;
const application_exceptions_1 = require("../../exceptions/application.exceptions");
exports.fileFieldValidation = {
    image: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
    video: ["video/mp4", "video/mkv", "video/webm", "video/ogg"],
    pdf: ["application/pdf"],
    excel: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    word: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};
const fileFilter = (validation) => {
    return function (req, file, cb) {
        if (!validation.includes(file.mimetype)) {
            return cb(new application_exceptions_1.BadRequestException('Invalid file format'));
        }
        return cb(null, true);
    };
};
exports.fileFilter = fileFilter;
