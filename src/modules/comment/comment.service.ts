import { toObjectId } from './../../common/utils/objectId';
import { BadRequestException } from '../../common/exceptions/application.exceptions';
import { redisService } from '../../common/services/redis.service';
import { HydratedDocument, Types } from "mongoose";
import { createCommentBodyDto, createCommentParamsDto, createReplyOnCommentParamsDto, deleteCommentParamsDto, updateCommentBodyDto, updateCommentParamsDto } from "./comment.dto";
import { IComment, IPost, IUser } from "../../common/interfaces";
import { UserRepository } from "../../database/repository/user.repository";
import { PostRepository } from "../../database/repository/post.repository";
import { NotFoundException } from '../../common/exceptions/application.exceptions';
import { s3Service, S3Service } from '../../common/services/s3.service';
import { notificationService } from '../../common/services/notification.service';
import { CommentRepository } from '../../database/repository';
import { getAvailability } from '../../common/utils/post';


export class CommentService {

    private userRepository: UserRepository
    private commentRepository: CommentRepository
    private postRepository: PostRepository
    private s3: S3Service

    constructor() {
        this.commentRepository = new CommentRepository()
        this.userRepository = new UserRepository()
        this.postRepository = new PostRepository()
        this.s3 = s3Service

    }


    async createComment({ postId }: createCommentParamsDto, { content, files = [], tags }: createCommentBodyDto, user: HydratedDocument<IUser>): Promise<IComment> {


        let post = await this.postRepository.findone({
            _id: postId,
            $or: getAvailability(user)
        })

        if (!post) {
            throw new NotFoundException('fail to find matching post')
        }

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


        const folderId = post.folderId
        let attachments: string[] = []

        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files as Express.Multer.File[],
                path: `Posts/${folderId}`
            })
        }


        let comment = await this.commentRepository.insertOne({
            createdBy: user._id,
            content: content as string,
            attachments,
            postId: post._id,
            tags: mentions
        })


        let populatedComment = await this.commentRepository.findById(
            (comment._id as Types.ObjectId).toString(),
            undefined,
            {
                populate: {
                    path: "createdBy",
                }
            }
        )

        if (!comment) {

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
                        message: `${user.userName} mention you in his comment`,
                        postId: post._id,
                        commentId: comment._id
                    })
                }
            })
        }

        return populatedComment
    }

    async replyOnComment({ postId, commentId }: createReplyOnCommentParamsDto, { content, files = [], tags }: createCommentBodyDto, user: HydratedDocument<IUser>): Promise<IComment> {


        let comment = await this.commentRepository.findone({
            _id: commentId,
            postId: postId,
        }, undefined, [{
            path: "postId",
            match: {
                $or: getAvailability(user)
            }
        }])

        if (!comment.postId) {
            throw new NotFoundException('fail to find matching comment')
        }

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

        const post = comment.postId as HydratedDocument<IPost>
        const folderId = post.folderId
        let attachments: string[] = []

        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files as Express.Multer.File[],
                path: `Posts/${folderId}`
            })
        }


        let reply = await this.commentRepository.insertOne({
            createdBy: user._id,
            content: content as string,
            attachments,
            postId: post._id,
            commentId: comment._id,
            tags: mentions
        })

        if (!reply) {

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
                        message: `${user.userName} mention you in his comment`,
                        postId: post._id,
                        commentId: comment._id,
                        replyId: reply._id
                    })
                }
            })
        }

        return reply.toJSON()
    }

    async updateComment({ postId, commentId }: updateCommentParamsDto, { content }: updateCommentBodyDto, user: HydratedDocument<IUser>): Promise<IComment> {

        const comment = await this.commentRepository.findOneAndUpdate(
            {
                _id: commentId,
                postId,
                createdBy: user._id,
                deletedAt: { $exists: false }
            },
            {
                $set: {
                    content,
                    updatedBy: user._id
                }
            }
        );

        if (!comment) {
            throw new NotFoundException("Comment not found");
        }

        return comment.toJSON();
    }

    async deleteComment({ postId, commentId }: deleteCommentParamsDto, user: HydratedDocument<IUser>): Promise<IComment> {

        const comment = await this.commentRepository.findOneAndUpdate(
            {
                _id: commentId,
                postId,
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

        if (!comment) {
            throw new NotFoundException("Comment not found");
        }

        return comment.toJSON();
    }

}




export const commentService = new CommentService()

