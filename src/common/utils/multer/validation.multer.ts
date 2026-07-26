import { FileFilterCallback } from "multer";
import { BadRequestException } from "../../exceptions/application.exceptions";
import { Request } from "express";




export const fileFieldValidation = {
    image: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
    video: ["video/mp4", "video/mkv", "video/webm", "video/ogg"],
    pdf: ["application/pdf"],
    excel: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    word: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};



export const fileFilter = (validation: string[]) => {
    return function (
        req: Request,
        file: Express.Multer.File,
        cb: FileFilterCallback,
    ) {

        if (!validation.includes(file.mimetype)) {
            return cb(new BadRequestException('Invalid file format'));
        }

        return cb(null, true);
    };
};
