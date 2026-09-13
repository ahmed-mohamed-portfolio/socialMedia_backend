"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postService = exports.PostService = void 0;
const application_exceptions_1 = require("../../common/exceptions/application.exceptions");
const node_crypto_1 = require("node:crypto");
const redis_service_1 = require("../../common/services/redis.service");
const mongoose_1 = require("mongoose");
const user_repository_1 = require("../../database/repository/user.repository");
const post_repository_1 = require("../../database/repository/post.repository");
const application_exceptions_2 = require("../../common/exceptions/application.exceptions");
const s3_service_1 = require("../../common/services/s3.service");
const notification_service_1 = require("../../common/services/notification.service");
const post_1 = require("../../common/utils/post");
const objectId_1 = require("../../common/utils/objectId");
class PostService {
    userRepository;
    postRepository;
    s3;
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
        this.postRepository = new post_repository_1.PostRepository();
        this.s3 = s3_service_1.s3Service;
    }
    async postList({ page, search, size }, user) {
        let posts = await this.postRepository.paginate({
            $or: (0, post_1.getAvailability)(user),
            ...(search ? { content: { $regex: search, $options: "i" } } : {})
        }, undefined, { sort: { createdAt: -1 } }, page, size);
        return posts;
    }
    async createPost({ availability, content, files = [], tags }, user) {
        const mentions = [];
        const FCM_Tokens = [];
        if (tags?.length) {
            const mentionedAccounts = await this.userRepository.find({ _id: { $in: tags } });
            if (mentionedAccounts.length != tags.length) {
                throw new application_exceptions_2.NotFoundException("Fail to find some or all mentioned accounts");
            }
            for (const tag of tags) {
                mentions.push(mongoose_1.Types.ObjectId.createFromHexString(tag));
                (await redis_service_1.redisService.getFCMs(tag) || []).map(token => FCM_Tokens.push(token));
                /* another way

                const tokens = await redisService.getFCMs(tag) || []
                FCM_Tokens.push(...tokens)

                */
            }
        }
        const folderId = (0, node_crypto_1.randomUUID)();
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Posts/${folderId}`
            });
        }
        let post = await this.postRepository.insertOne({
            createdBy: user._id,
            content: content,
            attachments,
            folderId,
            availability,
            tags: mentions
        });
        if (!post) {
            if (attachments?.length) {
                await this.s3.deleteAssets({
                    Keys: attachments.map(ele => { return { Key: ele }; })
                });
            }
            throw new application_exceptions_1.BadRequestException("fail in create post");
        }
        if (FCM_Tokens?.length) {
            await notification_service_1.notificationService.sendNotificationToTokens({
                tokens: FCM_Tokens,
                data: {
                    title: "Post Mention",
                    body: JSON.stringify({
                        message: `${user.userName} mention you in his post`,
                        postId: post._id
                    })
                }
            });
        }
        return post.toJSON();
    }
    async reactPost({ postId }, { react }, user) {
        const post = await this.postRepository.findOneAndUpdate({
            _id: postId,
            $or: (0, post_1.getAvailability)(user),
        }, {
            ...(Number(react) > 0 ? { $addToSet: { likes: user._id } } : { $pull: { likes: user._id } })
        });
        if (!post) {
            throw new application_exceptions_2.NotFoundException("Fail to find matching post");
        }
        return post.toJSON();
    }
    async updatePost({ postId }, { availability, content, files = [], tags = [], removeFiles = [], removeTags = [] }, user) {
        // console.log("removeTags", removeTags);
        const post = await this.postRepository.findOne({
            _id: postId,
            createdBy: user._id
        });
        if (!post) {
            throw new application_exceptions_2.NotFoundException("Fail to find matching post in updatePOst");
        }
        if (!post.content && !content && !files?.length && post.attachments?.length == removeFiles.length) {
            throw new application_exceptions_1.BadRequestException("We cannot leave empty post");
        }
        const mentions = [];
        const FCM_Tokens = [];
        if (tags?.length) {
            const mentionedAccounts = await this.userRepository.find({ _id: { $in: tags } });
            if (mentionedAccounts.length != tags.length) {
                throw new application_exceptions_2.NotFoundException("Fail to find some or all mentioned accounts");
            }
            for (const tag of tags) {
                mentions.push((0, objectId_1.toObjectId)(tag));
                (await redis_service_1.redisService.getFCMs(tag) || []).map(token => FCM_Tokens.push(token));
                /* another way

                const tokens = await redisService.getFCMs(tag) || []
                FCM_Tokens.push(...tokens)

                */
            }
        }
        const folderId = post.folderId;
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Posts/${folderId}`
            });
        }
        let upadePost = await this.postRepository.findOneAndUpdate({
            _id: postId,
            createdBy: user._id,
        }, [
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
                                    removeTags.map(ele => { return (0, objectId_1.toObjectId)(ele); })
                                ]
                            },
                            mentions
                        ]
                    }
                }
            }
        ]);
        if (!upadePost) {
            if (attachments?.length) {
                await this.s3.deleteAssets({
                    Keys: attachments.map(ele => { return { Key: ele }; })
                });
            }
            throw new application_exceptions_1.BadRequestException("fail in create post");
        }
        if (removeFiles.length) {
            await this.s3.deleteAssets({
                Keys: removeFiles.map(ele => { return { Key: ele }; })
            });
        }
        if (FCM_Tokens?.length) {
            await notification_service_1.notificationService.sendNotificationToTokens({
                tokens: FCM_Tokens,
                data: {
                    title: "Post Mention",
                    body: JSON.stringify({
                        message: `${user.userName} mention you in his post`,
                        postId: post._id
                    })
                }
            });
        }
        return upadePost.toJSON();
    }
}
exports.PostService = PostService;
exports.postService = new PostService();
