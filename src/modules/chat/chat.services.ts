import { randomUUID } from 'node:crypto';
import { HydratedDocument, Types } from "mongoose";
import { IChat, IMessage, IUser } from "../../common/interfaces";
import { ChatRepository, UserRepository } from "../../database/repository";
import { toObjectId } from "../../common/utils/objectId";
import { NotFoundException } from "../../common/exceptions/application.exceptions";
import { ChatEnum, StorageApproachEnum } from "../../common/enums";
import { S3Service } from '../../common/services/s3.service';

export class ChatService {

    private chatRepository: ChatRepository
    private userRepository: UserRepository
    private s3Service: S3Service

    constructor() {

        this.chatRepository = new ChatRepository();
        this.userRepository = new UserRepository();
        this.s3Service = new S3Service();

    }


    sayHi = () => {
        return "say hi Done";
    }

    async getChat(participantId: string, { page, size }: { page: string, size: string }, user: HydratedDocument<IUser>): Promise<IChat> {
        console.log("participantId", participantId);

        const chat = await this.chatRepository.findOneChat(
            {
                participants: {
                    $all: [user._id, toObjectId(participantId)]
                }
            },
            undefined
            ,
            {
                populate: [{ path: 'participants' }]
            },
            page,
            size
        );
        console.log("chat===>", chat);

        if (!chat) {
            throw new NotFoundException(
                "Fail to find Matching Conversation"
            );
        }

        return chat.toJSON();
    }

    async sendMessage({ content, sendTo }: { content: string, sendTo: string }, userId: Types.ObjectId): Promise<Partial<IMessage>> {

        const message = {
            _id: new Types.ObjectId(),
            content,
            createdBy: userId,
            createdAt: new Date()
        };


        let chat = await this.chatRepository.findOneAndUpdate({
            participants: { $all: [userId, toObjectId(sendTo)] },
            type: ChatEnum.ovo
        }, {
            $push: {
                messages: message
            }
        }
        )


        if (!chat) {
            chat = await this.chatRepository.insertOne({
                participants: [userId, toObjectId(sendTo)],
                createdBy: userId,
                type: ChatEnum.ovo,
                messages: [
                    message
                ]

            }
            )
        }

        return message
    }

    async getUsersInChat(userId: string) {
        const participants: IChat[] = await this.chatRepository.find(
            {
                participants: { $in: [userId] },
                type: ChatEnum.ovo
            },
            "participants"
        );


        console.log("participants", participants);

        const otherUserIds = participants.map(chat => chat.participants.find(id => id.toString() !== userId)!.toString());


        console.log("otherUserIds", otherUserIds);



        const usersInChat = await this.userRepository.find(
            {
                _id: { $in: otherUserIds }
            },
            "-password"
        );

        return usersInChat;
    }




    //not test in front yet
    async createGroup({ participantsIds = [], group }: { participantsIds: string[] | Types.ObjectId[], group: string }, file: Express.Multer.File, user: HydratedDocument<IUser>): Promise<IChat> {

        participantsIds = [
            ...new Set(
                participantsIds.map(ele => {
                    return toObjectId(ele as string);
                })
            )
        ];

        const users = await this.userRepository.find({
            filter: {
                _id: { $in: participantsIds },
                friends: { $in: [user._id] }
            }
        });

        if (users.length != participantsIds.length) {
            throw new NotFoundException("Fail to find all participants");
        }

        let group_image!: string;

        const room_Id = randomUUID();
        const path = `Chat/group/${room_Id}`;

        if (file) {
            group_image = await this.s3Service.uploadAsset({ file, path, StorageApproach: StorageApproachEnum.MEMORY })
        }

        const chattingGroup = await this.chatRepository.create({
            participants: [...participantsIds, user._id],
            createdBy: user._id,
            messages: [],
            type: ChatEnum.ovm,
            group,
            roomId: room_Id,
            group_image
        });

        return chattingGroup.toJSON();
    }


    //not test in front yet
    async getGroupChat(groupId: string, { page, size }: { page?: string, size?: string }, user: HydratedDocument<IUser>) {

        const chat = await this.chatRepository.findOneChat({
            filter: {
                _id: toObjectId(groupId),
                participants: { $in: [user._id] },
                type: ChatEnum.ovm
            },
            options: {
                populate: [{ path: 'participants' }, { path: 'messages.createdBy' }]
            },
            page,
            size
        });

        if (!chat) {
            throw new NotFoundException("Fail to find Matching Conversation");
        }

        return chat.toJSON();
    }

    //not test in front yet
    async sendGroupMessage({ content, groupId }: { content: string, groupId: string }, user: HydratedDocument<IUser>): Promise<string> {

        let chat = await this.chatRepository.findOneAndUpdate({
            filter: {
                _id: toObjectId(groupId),
                participants: { $in: [user._id] },
                type: ChatEnum.ovm
            },
            update: {
                $addToSet: {
                    messages: {
                        content,
                        createdBy: user._id
                    }
                }
            }
        });

        if (!chat) {
            throw new NotFoundException("Fail to find matching group");
        }

        return chat.roomId
    }

}


export const chatService = new ChatService();
