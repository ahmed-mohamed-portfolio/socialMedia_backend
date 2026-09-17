import { BadRequestException } from './../../common/exceptions/application.exceptions';
import { randomUUID } from 'node:crypto';
import { redisService } from './../../common/services/redis.service';
import { HydratedDocument, Types } from "mongoose";
import { createPostBodyDto, deletePostSchemaDto, getSinglePostParamsDto, getUserPostsParamDto, ReactPostParamsDto, ReactPostQueryDto, updatePostBodyDto, updatePostParamsDto } from "./post.dto";
import { IPaginate, IPost, IUser } from "../../common/interfaces";
import { UserRepository } from "../../database/repository/user.repository";
import { PostRepository } from "../../database/repository/post.repository";
import { NotFoundException } from '../../common/exceptions/application.exceptions';
import { s3Service, S3Service } from '../../common/services/s3.service';
import { notificationService } from '../../common/services/notification.service';
import { getAvailability } from '../../common/utils/post';
import { PaginateDto } from '../../common/validation';
import { toObjectId } from '../../common/utils/objectId';


export class PostService {

    private userRepository: UserRepository
    private postRepository: PostRepository
    private s3: S3Service

    constructor() {
        this.userRepository = new UserRepository()
        this.postRepository = new PostRepository()
        this.s3 = s3Service

    }

    async postList({ page, search, size }: PaginateDto, user: HydratedDocument<IUser>): Promise<IPaginate<IPost>> {

        let posts = await this.postRepository.paginate({
            $or: getAvailability(user),

            ...(search ? { content: { $regex: search, $options: "i" } } : {})

        }, undefined, { sort: { createdAt: -1 }, populate: [{ path: "createdBy" }, { path: "comments", options: { sort: { createdAt: -1 } }, populate: [{ path: "createdBy" }, { path: "reply", populate: [{ path: "reply" }] }] }] }, page, size)
        return posts
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

    async reactPost({ postId }: ReactPostParamsDto, { react }: ReactPostQueryDto, user: HydratedDocument<IUser>): Promise<IPost> {

        const post = await this.postRepository.findOneAndUpdate(

            {
                _id: postId,
                $or: getAvailability(user),
            },
            {
                ...(Number(react) > 0 ? { $addToSet: { likes: user._id } } : { $pull: { likes: user._id } })
            }

        )

        if (!post) {
            throw new NotFoundException("Fail to find matching post")
        }

        return post.toJSON()
    }

    async updatePost({ postId }: updatePostParamsDto, { availability, content, files = [], tags = [], removeFiles = [], removeTags = [] }: updatePostBodyDto, user: HydratedDocument<IUser>): Promise<IPost> {

        const post = await this.postRepository.findOne({
            _id: postId,
            createdBy: user._id
        })

        if (!post) {
            throw new NotFoundException("Fail to find matching post in updatePOst")
        }

        if (!post.content && !content && !files?.length && post.attachments?.length == removeFiles.length) {
            throw new BadRequestException("We cannot leave empty post")
        }


        const mentions: Types.ObjectId[] = []
        const FCM_Tokens: string[] = []

        if (tags?.length) {
            const mentionedAccounts = await this.userRepository.find({ _id: { $in: tags } })

            if (mentionedAccounts.length != tags.length) {
                throw new NotFoundException("Fail to find some or all mentioned accounts")
            }

            for (const tag of tags) {
                mentions.push(toObjectId(tag));

                (await redisService.getFCMs(tag) || []).map(token => FCM_Tokens.push(token))

                /* another way

                const tokens = await redisService.getFCMs(tag) || []
                FCM_Tokens.push(...tokens)

                */
            }

        }


        const folderId = post.folderId
        let attachments: string[] = []

        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files as Express.Multer.File[],
                path: `Posts/${folderId}`
            })
        }


        let upadePost = await this.postRepository.findOneAndUpdate({
            _id: postId,
            createdBy: user._id,

        },


            [
                {
                    $set: {
                        content: content || post.content,
                        availability: Number(availability || post.availability),
                        updatedBy: user._id,
                        attachments: {
                            $setUnion: [

                                {
                                    $setDifference: [
                                        "$attachments",
                                        removeFiles
                                    ]
                                },

                                attachments
                            ]

                        },
                        tags: {
                            $setUnion: [

                                {
                                    $setDifference: [
                                        "$tags",
                                        removeTags.map(ele => { return toObjectId(ele) })
                                    ]
                                },
                                mentions
                            ]

                        }

                    }
                }
            ]
        )

        if (!upadePost) {

            if (attachments?.length) {

                await this.s3.deleteAssets({
                    Keys: attachments.map(ele => { return { Key: ele } })
                })

            }

            throw new BadRequestException("fail in create post")
        }

        if (removeFiles.length) {
            await this.s3.deleteAssets({
                Keys: removeFiles.map(ele => { return { Key: ele } })
            })
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

        return upadePost.toJSON()
    }

    async getSinglePost({ id }: getSinglePostParamsDto): Promise<IPost> {
        const post = await this.postRepository.findOne({
            _id: id,
        }, undefined, { populate: [{ path: "createdBy" }, { path: "comments" }] })

        if (!post) {
            throw new NotFoundException("Fail to find matching post")
        }

        return post.toJSON()
    }

    async userPosts({ userId }: getUserPostsParamDto): Promise<IPost[]> {
        const posts = await this.postRepository.find(
            {
                createdBy: userId
            },
            undefined,
            {
                sort: { createdAt: -1 },
                populate: [
                    {
                        path: "createdBy",
                    },
                    {
                        path: "comments",
                        options: { sort: { createdAt: -1 } },
                        populate: [
                            {
                                path: "createdBy",
                            },
                            {
                                path: "reply",
                                populate: [
                                    {
                                        path: "createdBy",
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        )

        return posts
    }

    async deletePost({ postId }: deletePostSchemaDto, user: HydratedDocument<IUser>): Promise<IPost> {

        const post = await this.postRepository.findOneAndUpdate(
            {
                _id: postId,
                createdBy: user._id,
                deletedAt: { $exists: false }
            },
            {
                $set: {
                    deletedAt: new Date(),
                    updatedBy: user._id
                },
                $unset: { restoredAt: 1 }
            }
        );

        if (!post) {
            throw new NotFoundException("Post not found");
        }

        return post.toJSON();
    }

}


export const postService = new PostService()