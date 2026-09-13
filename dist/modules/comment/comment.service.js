"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentService = exports.CommentService = void 0;
const application_exceptions_1 = require("../../common/exceptions/application.exceptions");
const redis_service_1 = require("../../common/services/redis.service");
const mongoose_1 = require("mongoose");
const user_repository_1 = require("../../database/repository/user.repository");
const post_repository_1 = require("../../database/repository/post.repository");
const application_exceptions_2 = require("../../common/exceptions/application.exceptions");
const s3_service_1 = require("../../common/services/s3.service");
const notification_service_1 = require("../../common/services/notification.service");
const repository_1 = require("../../database/repository");
const post_1 = require("../../common/utils/post");
class CommentService {
    userRepository;
    commentRepository;
    postRepository;
    s3;
    constructor() {
        this.commentRepository = new repository_1.CommentRepository();
        this.userRepository = new user_repository_1.UserRepository();
        this.postRepository = new post_repository_1.PostRepository();
        this.s3 = s3_service_1.s3Service;
    }
    async createComment({ postId }, { content, files = [], tags }, user) {
        let post = await this.postRepository.findone({
            _id: postId,
            $or: (0, post_1.getAvailability)(user)
        });
        if (!post) {
            throw new application_exceptions_2.NotFoundException('fail to find matching post');
        }
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
        const folderId = post.folderId;
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Posts/${folderId}`
            });
        }
        let comment = await this.commentRepository.insertOne({
            createdBy: user._id,
            content: content,
            attachments,
            postId: post._id,
            tags: mentions
        });
        if (!comment) {
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
                        message: `${user.userName} mention you in his comment`,
                        postId: post._id,
                        commentId: comment._id
                    })
                }
            });
        }
        return comment.toJSON();
    }
    async replyOnComment({ postId, commentId }, { content, files = [], tags }, user) {
        let comment = await this.commentRepository.findone({
            _id: commentId,
            postId: postId,
        }, undefined, [{
                path: "postId",
                match: {
                    $or: (0, post_1.getAvailability)(user)
                }
            }]);
        if (!comment.postId) {
            throw new application_exceptions_2.NotFoundException('fail to find matching comment');
        }
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
        const post = comment.postId;
        const folderId = post.folderId;
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Posts/${folderId}`
            });
        }
        let reply = await this.commentRepository.insertOne({
            createdBy: user._id,
            content: content,
            attachments,
            postId: post._id,
            commentId: comment._id,
            tags: mentions
        });
        if (!reply) {
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
                        message: `${user.userName} mention you in his comment`,
                        postId: post._id,
                        commentId: comment._id,
                        replyId: reply._id
                    })
                }
            });
        }
        return reply.toJSON();
    }
}
exports.CommentService = CommentService;
exports.commentService = new CommentService();
