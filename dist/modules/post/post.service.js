"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postService = exports.PostService = void 0;
const application_exceptions_1 = require("./../../common/exceptions/application.exceptions");
const node_crypto_1 = require("node:crypto");
const redis_service_1 = require("./../../common/services/redis.service");
const mongoose_1 = require("mongoose");
const user_repository_1 = require("../../database/repository/user.repository");
const post_repository_1 = require("../../database/repository/post.repository");
const application_exceptions_2 = require("../../common/exceptions/application.exceptions");
const s3_service_1 = require("../../common/services/s3.service");
const notification_service_1 = require("../../common/services/notification.service");
const post_1 = require("../../common/utils/post");
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
}
exports.PostService = PostService;
exports.postService = new PostService();
