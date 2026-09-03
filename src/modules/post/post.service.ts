import { BadRequestException } from './../../common/exceptions/application.exceptions';
import { randomUUID } from 'node:crypto';
import { redisService } from './../../common/services/redis.service';
import { HydratedDocument, Types } from "mongoose";
import { createPostBodyDto } from "./post.dto";
import { IPost, IUser } from "../../common/interfaces";
import { UserRepository } from "../../database/repository/user.repository";
import { PostRepository } from "../../database/repository/post.repository";
import { NotFoundException } from '../../common/exceptions/application.exceptions';
import { s3Service, S3Service } from '../../common/services/s3.service';
import { notificationService } from '../../common/services/notification.service';


export class PostService {

    private userRepository: UserRepository
    private postRepository: PostRepository
    private s3: S3Service

    constructor() {
        this.userRepository = new UserRepository()
        this.postRepository = new PostRepository()
        this.s3 = s3Service

    }

    async createPost({ availability, content, files = [], tags }: createPostBodyDto, user: HydratedDocument<IUser>): Promise<IPost> {
        const mentions: Types.ObjectId[] = []
        const FCM_Tokens: string[] = []

        if (tags?.length) {
            const mentionedAccounts = await this.userRepository.find({ _id: { $in: tags } })

            if (mentionedAccounts.length != tags.length) {
                throw new NotFoundException("Fail to find some or all mentioned accounts")
            }

            for (const tag of tags) {
                mentions.push(Types.ObjectId.createFromHexString(tag));

                (await redisService.getFCMs(tag) || []).map(token => FCM_Tokens.push(token))

                /* another way

                const tokens = await redisService.getFCMs(tag) || []
                FCM_Tokens.push(...tokens)

                */
            }

        }


        const folderId = randomUUID()
        let attachments: string[] = []

        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files as Express.Multer.File[],
                path: `Posts/${folderId}`
            })
        }


        let post = await this.postRepository.insertOne({
            createdBy: user._id,
            content: content as string,
            attachments,
            folderId,
            availability,
            tags: mentions
        })

        if (!post) {

            if (attachments?.length) {

                await this.s3.deleteAssets({
                    Keys: attachments.map(ele => { return { Key: ele } })
                })

            }

            throw new BadRequestException("fail in create post")
        }

        if (FCM_Tokens?.length) {
            await notificationService.sendNotificationToTokens({
                tokens: FCM_Tokens,
                data: {
                    title: "Post Mention",
                    body: JSON.stringify({
                        message: `${user.userName} mention you in his post`,
                        postId: post._id
                    })
                }
            })
        }

        return post.toJSON()
    }


}


export const postService = new PostService()