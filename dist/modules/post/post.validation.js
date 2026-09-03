"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPostSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../common/enums");
const mongoose_1 = require("mongoose");
const validation_1 = require("../../common/validation");
const multer_1 = require("../../common/utils/multer");
exports.createPostSchema = {
    body: zod_1.z.strictObject({
        content: zod_1.z.string().optional(),
        files: zod_1.z.array(validation_1.generalValidationFields.file(multer_1.fileFieldValidation.image)).optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        availability: zod_1.z.coerce.number().default(enums_1.AvailabilityEnum.PUBLIC)
    }).superRefine((args, ctx) => {
        // لازم البوست يكون فيه content أو files
        if (!args.files?.length && !args.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "Content is required"
            });
        }
        if (args.tags?.length) {
            // التأكد إن مفيش tags متكررة
            const uniqueTags = [...new Set(args.tags)];
            if (uniqueTags.length != args.tags.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "Duplicated tag"
                });
            }
            // التأكد إن كل tag عبارة عن MongoDB ObjectId صحيح
            for (const tag of args.tags) {
                if (!mongoose_1.Types.ObjectId.isValid(tag)) {
                    ctx.addIssue({
                        code: "custom",
                        path: ["tags"],
                        message: `Invalid tagged objectId ${tag}`
                    });
                }
            }
        }
    })
};
