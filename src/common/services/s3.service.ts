import { UploadApproachEnum } from './../enums/multer.enum';
import { randomUUID } from 'node:crypto';
import { CompleteMultipartUploadCommandOutput, DeleteObjectCommand, DeleteObjectCommandOutput, DeleteObjectsCommand, DeleteObjectsCommandOutput, GetObjectCommand, GetObjectCommandOutput, ListObjectsV2Command, ListObjectsV2CommandOutput, ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { APPLICATION_NAME, AWS_ACCESS_KEY_ID, AWS_BUCKET_NAME, AWS_EXPIRES_IN, AWS_REGION, AWS_SECRET_ACCESS_KEY } from "../../config";
import { BadRequestException } from '../exceptions/application.exceptions';
import { StorageApproachEnum } from '../enums';
import { createReadStream } from 'node:fs';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';




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
        ContentType?: string | undefined,
        StorageApproach: StorageApproachEnum
    }): Promise<string> {

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

    async uploadLargeAsset({
        StorageApproach = StorageApproachEnum.DISK,
        Bucket = AWS_BUCKET_NAME,
        path = 'general',
        file,
        ACL = ObjectCannedACL.private,
        ContentType,
        partSize = 5
    }: {
        StorageApproach?: StorageApproachEnum;
        Bucket?: string;
        path?: string;
        file: Express.Multer.File;
        ACL?: ObjectCannedACL;
        ContentType?: string | undefined;
        partSize?: number;
    }): Promise<CompleteMultipartUploadCommandOutput> {
        const uploadFile = new Upload({
            client: this.client,
            params: {
                Bucket,
                Key: `${APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`,
                ACL,
                Body: (StorageApproach === StorageApproachEnum.MEMORY) ? file.buffer : createReadStream(file.path),
                ContentType: file.mimetype || ContentType,
            },
            partSize: partSize * 1024 * 1024
        });

        uploadFile.on('httpUploadProgress', (progress) => {
            console.log("progress", progress);

            console.log(`File Upload is ${((progress.loaded as number) / (progress.total as number)) * 100}%`,);
        });

        return await uploadFile.done();
    }

    async uploadAssets({
        Bucket = AWS_BUCKET_NAME,
        path = "general",
        files,
        ACL = ObjectCannedACL.private,
        ContentType,
        StorageApproach = StorageApproachEnum.MEMORY,
        UploadApproach = UploadApproachEnum.SMALL
    }: {
        Bucket?: string,
        path?: string,
        files: Express.Multer.File[],
        ACL?: ObjectCannedACL,
        ContentType?: string | undefined,
        StorageApproach: StorageApproachEnum,
        UploadApproach: UploadApproachEnum
    }): Promise<string[]> {

        let urls: string[] = []

        if (UploadApproach === UploadApproachEnum.LARGE) {
            const data = await Promise.all(
                files.map((file) => {
                    return this.uploadLargeAsset({ Bucket, path, file, ACL, ContentType, StorageApproach })
                })
            )

            urls = data.map((ele) => ele.Key as string)

        } else {
            urls = await Promise.all(
                files.map((file) => {
                    return this.uploadAsset({ Bucket, path, file, ACL, ContentType, StorageApproach })
                })
            )
        }

        return urls
    }

    async createPreSignedUploadLink({
        Bucket = AWS_BUCKET_NAME,
        path = "general",
        expiresIn = parseInt(AWS_EXPIRES_IN),
        Originalname,
        ContentType,
    }: {
        Bucket?: string,
        path?: string,
        expiresIn?: number,
        Originalname: string,
        ContentType: string,
    }): Promise<{ url: string, key: string }> {

        const command = new PutObjectCommand({
            Bucket,
            Key: `${APPLICATION_NAME}/${path}/${randomUUID()}__${Originalname}`,
            ContentType
        })

        if (!command.input?.Key) {
            throw new BadRequestException("Fail to upload this asset")
        }


        const url = await getSignedUrl(this.client, command, { expiresIn })

        return { url, key: command.input.Key }

    }

    async getAsset({
        Bucket = AWS_BUCKET_NAME,
        Key,
    }: {
        Bucket?: string,
        Key: string,
    }): Promise<GetObjectCommandOutput> {

        const command = new GetObjectCommand({
            Bucket,
            Key
        })

        return await this.client.send(command);

    }

    async createPreSignedFetchLink({
        Bucket = AWS_BUCKET_NAME,
        Key,
        expiresIn = parseInt(AWS_EXPIRES_IN),
        fileName,
        download

    }: {
        Bucket?: string,
        Key: string,
        expiresIn?: number,
        fileName?: string,
        download?: string

    }): Promise<string> {

        const command = new GetObjectCommand({
            Bucket,
            Key,
            ResponseContentDisposition: download === "true" ? `attachment; filename="${fileName || Key.split("/").pop()}"` : undefined

        })

        const url = await getSignedUrl(this.client, command, { expiresIn })

        return url

    }

    async deleteAsset({
        Bucket = AWS_BUCKET_NAME,
        Key,
    }: {
        Bucket?: string;
        Key: string;
    }): Promise<DeleteObjectCommandOutput> {
        const command = new DeleteObjectCommand({
            Bucket,
            Key,
        });
        return await this.client.send(command);
    }

    async deleteAssets({
        Bucket = AWS_BUCKET_NAME,
        Keys,
    }: {
        Bucket?: string;
        Keys: { Key: string }[];
    }): Promise<DeleteObjectsCommandOutput> {
        const command = new DeleteObjectsCommand({
            Bucket,
            Delete: {
                Objects: Keys,
                Quiet: false
            }
        });
        return await this.client.send(command);
    };

    async listFolderDir({
        Bucket = AWS_BUCKET_NAME,
        prefix
    }: {
        Bucket?: string;
        prefix: string;
    }): Promise<ListObjectsV2CommandOutput> {

        const command = new ListObjectsV2Command({
            Bucket,
            Prefix: `${APPLICATION_NAME}/${prefix}`,
        });

        return await this.client.send(command);
    }

    async deleteFolderByPrefix({
        Bucket = AWS_BUCKET_NAME,
        prefix,
    }: {
        Bucket?: string;
        prefix: string;
    }): Promise<DeleteObjectsCommandOutput> {
        const result = await this.listFolderDir({ Bucket, prefix });

        const Keys = result.Contents?.map((ele) => {
            return { Key: ele.Key };
        }) as { Key: string }[];

        return await this.deleteAssets({ Bucket, Keys });
    }

}


export const s3Service = new S3Service()