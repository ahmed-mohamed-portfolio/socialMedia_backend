import { HydratedDocument, Types } from "mongoose";
import { IChat, IMessage, IUser } from "../../common/interfaces";
import { ChatRepository, UserRepository } from "../../database/repository";
import { toObjectId } from "../../common/utils/objectId";
import { NotFoundException } from "../../common/exceptions/application.exceptions";
import { ChatEnum } from "../../common/enums";

export class ChatService {

    private chatRepository: ChatRepository
    private userRepository: UserRepository
    constructor() {

        this.chatRepository = new ChatRepository();
        this.userRepository = new UserRepository();
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

}


export const chatService = new ChatService();
