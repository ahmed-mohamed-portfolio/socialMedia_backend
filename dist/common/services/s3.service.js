"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Service = exports.S3Service = void 0;
const multer_enum_1 = require("./../enums/multer.enum");
const node_crypto_1 = require("node:crypto");
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = require("../../config");
const application_exceptions_1 = require("../exceptions/application.exceptions");
const enums_1 = require("../enums");
const node_fs_1 = require("node:fs");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3Service {
    client;
    constructor() {
        this.client = new client_s3_1.S3Client({
            region: config_1.AWS_REGION,
            credentials: {
                accessKeyId: config_1.AWS_ACCESS_KEY_ID,
                secretAccessKey: config_1.AWS_SECRET_ACCESS_KEY
            }
        });
    }
    async uploadAsset({ Bucket = config_1.AWS_BUCKET_NAME, path = "general", file, ACL = client_s3_1.ObjectCannedACL.private, ContentType, StorageApproach = enums_1.StorageApproachEnum.MEMORY }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket,
            Key: `${config_1.APPLICATION_NAME}/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
            ACL,
            Body: (StorageApproach === enums_1.StorageApproachEnum.MEMORY) ? file.buffer : (0, node_fs_1.createReadStream)(file.path),
            ContentType: file.mimetype || ContentType
        });
        if (!command.input?.Key) {
            throw new application_exceptions_1.BadRequestException("Fail to upload this asset");
            /*Example of return =====
                input: {
                  Bucket: 'c45nodesocialmedia',
                  Key: 'SOCIAL_MEDIA_APP/Users/6a64654b7984842d931faa2d/Profile/91aa730f-172b-4728-b30c-c44cb1d01e3e__713824346_2140542567342830_4081619045036051037_n.jpg',
                  ACL: 'private',
                  Body: <Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 01 00 00 01 00 01 00 00 ff ed 00 84 50 68 6f 74 6f 73 68 6f 70 20 33 2e 30 00 38 42 49 4d 04 04 00 00 00 00 00 68 ... 173366 more bytes>,
                  ContentType: 'image/jpeg'
                },
            */
        }
        console.log(command);
        await this.client.send(command);
        return command.input?.Key;
    }
    async uploadLargeAsset({ StorageApproach = enums_1.StorageApproachEnum.DISK, Bucket = config_1.AWS_BUCKET_NAME, path = 'general', file, ACL = client_s3_1.ObjectCannedACL.private, ContentType, partSize = 5 }) {
        const uploadFile = new lib_storage_1.Upload({
            client: this.client,
            params: {
                Bucket,
                Key: `${config_1.APPLICATION_NAME}/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
                ACL,
                Body: (StorageApproach === enums_1.StorageApproachEnum.MEMORY) ? file.buffer : (0, node_fs_1.createReadStream)(file.path),
                ContentType: file.mimetype || ContentType,
            },
            partSize: partSize * 1024 * 1024
        });
        uploadFile.on('httpUploadProgress', (progress) => {
            console.log("progress", progress);
            console.log(`File Upload is ${(progress.loaded / progress.total) * 100}%`);
        });
        return await uploadFile.done();
    }
    async uploadAssets({ Bucket = config_1.AWS_BUCKET_NAME, path = "general", files, ACL = client_s3_1.ObjectCannedACL.private, ContentType, StorageApproach = enums_1.StorageApproachEnum.MEMORY, UploadApproach = multer_enum_1.UploadApproachEnum.SMALL }) {
        let urls = [];
        if (UploadApproach === multer_enum_1.UploadApproachEnum.LARGE) {
            const data = await Promise.all(files.map((file) => {
                return this.uploadLargeAsset({ Bucket, path, file, ACL, ContentType, StorageApproach });
            }));
            urls = data.map((ele) => ele.Key);
        }
        else {
            urls = await Promise.all(files.map((file) => {
                return this.uploadAsset({ Bucket, path, file, ACL, ContentType, StorageApproach });
            }));
        }
        return urls;
    }
    async createPreSignedUploadLink({ Bucket = config_1.AWS_BUCKET_NAME, path = "general", expiresIn = parseInt(config_1.AWS_EXPIRES_IN), Originalname, ContentType, }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket,
            Key: `${config_1.APPLICATION_NAME}/${path}/${(0, node_crypto_1.randomUUID)()}__${Originalname}`,
            ContentType
        });
        if (!command.input?.Key) {
            throw new application_exceptions_1.BadRequestException("Fail to upload this asset");
        }
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        return { url, key: command.input.Key };
    }
    async getAsset({ Bucket = config_1.AWS_BUCKET_NAME, Key, }) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket,
            Key
        });
        return await this.client.send(command);
    }
    async createPreSignedFetchLink({ Bucket = config_1.AWS_BUCKET_NAME, Key, expiresIn = parseInt(config_1.AWS_EXPIRES_IN), fileName, download }) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket,
            Key,
            ResponseContentDisposition: download === "true" ? `attachment; filename="${fileName || Key.split("/").pop()}"` : undefined
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        return url;
    }
    async deleteAsset({ Bucket = config_1.AWS_BUCKET_NAME, Key, }) {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket,
            Key,
        });
        return await this.client.send(command);
    }
    async deleteAssets({ Bucket = config_1.AWS_BUCKET_NAME, Keys, }) {
        const command = new client_s3_1.DeleteObjectsCommand({
            Bucket,
            Delete: {
                Objects: Keys,
                Quiet: false
            }
        });
        return await this.client.send(command);
    }
    ;
}
exports.S3Service = S3Service;
exports.s3Service = new S3Service();
