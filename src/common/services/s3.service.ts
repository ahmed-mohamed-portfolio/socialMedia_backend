import { randomUUID } from 'node:crypto';
import { ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { APPLICATION_NAME, AWS_ACCESS_KEY_ID, AWS_BUCKET_NAME, AWS_REGION, AWS_SECRET_ACCESS_KEY } from "../../config";
import { BadRequestException } from '../exceptions/application.exceptions';
import { StorageApproachEnum } from '../enums';
import { createReadStream } from 'node:fs';




export class S3Service {
    private client: S3Client;

    constructor() {
        this.client = new S3Client({
            region: AWS_REGION,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY
            }
        })
    }


    async uploadAsset({
        Bucket = AWS_BUCKET_NAME,
        path = "general",
        file,
        ACL = ObjectCannedACL.private,
        ContentType,
        StorageApproach = StorageApproachEnum.MEMORY
    }: {
        Bucket?: string,
        path?: string,
        file: Express.Multer.File,
        ACL?: ObjectCannedACL,
        ContentType?: string,
        StorageApproach: StorageApproachEnum
    }) {

        const command = new PutObjectCommand({
            Bucket,
            Key: `${APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`,
            ACL,
            Body: (StorageApproach === StorageApproachEnum.MEMORY) ? file.buffer : createReadStream(file.path),
            ContentType: file.mimetype || ContentType
        })
        if (!command.input?.Key) {
            throw new BadRequestException("Fail to upload this asset")

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

        return command.input?.Key
    }
}


export const s3Service = new S3Service()