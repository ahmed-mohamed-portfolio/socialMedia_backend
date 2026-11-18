import { RedisService, redisService } from './../../../common/services/redis.service';
import { Server, Socket } from "socket.io";
import { ChatService } from "../chat.services";
import { SocketValidation } from "../../../middleware/validation.middleware";
import * as validators from '../chat.validation'
import authService from "./../../auth/auth.service"




export class ChatEvent {


    private chatService: ChatService
    private redisService: RedisService
    constructor() {
        this.chatService = new ChatService();
        this.redisService = new RedisService()
    }


    sayHi = (socket: Socket) => {


        return socket.on("sayHI", async (data: { name: string }, callback) => {


            try {


                await SocketValidation<{ name: string }>(validators.sayHi, data)
                console.log({ data });


                // callback({
                //     message: "received successfully"
                // });


                const result = this.chatService.sayHi()


                socket.emit("sayHI", result);


                // socket.emit("sayHI", { message: "from front to back" }); // for only the on user
                // io.emit("sayHI", "hello to all")// for all  on users
                // socket.broadcast.emit("sayHI", "hello to all")// for all  on users exipt sender user
                // socket.to(connections).emit("sayHI", "hello all") //for all in connections ids list  exipt sender user
                // io.to(connections).emit("sayHI", "hello all") //for all in connections ids list
                // socket.except(connections).emit("sayHI", "hello all")
                // io.except(connections).emit("sayHI", "hello all")




                // socket.emit()
                // أنا فقط


                // io.emit()
                // كل الناس وأنا منهم


                // socket.broadcast.emit()
                // كل الناس ماعدايا


                // socket.to(ids)
                // الناس اللي أحددهم ماعدايا


                // io.to(ids)
                // كل الناس اللي أحددهم حتى أنا لو موجود فيهم


                // socket.except(ids)
                // كل الناس ماعدايا وماعدا ids


                // io.except(ids)
                // كل الناس ماعدا ids
            } catch (error) {
                socket.emit("custom_error", error)


                // في Socket.IO يوجد Reserved Event Names لا يجوز لك استخدامها مع socket.emit() أو socket.on() كـ Events خاصة بتطبيقك.


                // connect
                // connect_error
                // disconnect
                // disconnecting
                // newListener
                // removeListener
            }


        });




    }

    sendMessage = (socket: Socket, io: Server) => {
        return socket.on("sendMessage", async ({ content, sendTo }) => {
            try {
                // console.log("socket.data", socket.data);
                console.log("{ content, sendTo }", { content, sendTo });

                let userId = socket.data.id
                let message = await this.chatService.sendMessage({ content, sendTo }, userId)    //save to database
                console.log("message", message);

                io.to(await redisService.getSockets(userId)).emit("successMessage", message) // user A   successMessage

                let receverSocketIds = await redisService.getSockets(sendTo)
                if (receverSocketIds.length) {
                    let userData = await authService.getUserProfile(userId) // this is not good code user info must come from decoded token

                    socket.to(receverSocketIds).emit("newMessage", { message, from: userData })   //user B   newMessage
                }
                // console.log({ content, sendTo });
            } catch (error) {
                socket.emit("custom_error", error)
            }

        })
    }

    usersInChat = async (socket: Socket) => {

        socket.on("getUsersInChat", async () => {

            try {

                let userId = socket.data.id

                const usersInChat = await this.chatService.getUsersInChat(userId);

                socket.emit('usersInChat', usersInChat);


            } catch (error) {
                socket.emit("custom_error", error)
            }

        })
    }

    checkStatus = (socket: Socket) => {

        return socket.on("checkStatus", async (userId: string) => {
            try {

                const userSockets = await redisService.getSockets(userId);

                socket.emit("onlineOrOffline", {
                    userId,
                    isOnline: userSockets.length > 0
                });

            } catch (error) {
                socket.emit("custom_error", error);
            }
        });
    }


    //not test in front yet
    sendGroupMessage = (socket: Socket, io: Server) => {

        return socket.on("sendGroupMessage", async ({ content, groupId }: { groupId: string, content: string }) => {
            try {
                console.log({ content, groupId });

                const roomId = await this.chatService.sendGroupMessage({ content, groupId }, socket.data.user);

                io.to(await this.redisService.getSockets(socket.data.user._id)).emit("successMessage", {
                    content,
                    sendTo: groupId
                });

                socket.to(roomId).emit("newMessage", { content, groupId })
            } catch (error) {
                console.log({ error });

                socket.emit("custom_error", error);
            }
        }
        );
    }



    //not test in front yet
    join_room = (socket: Socket, io: Server) => {

        return socket.on("join_room", async ({ roomId }: { roomId: string }) => {
            try {
                socket.join(roomId);

            } catch (error) {
                console.log({ error });

                socket.emit("custom_error", error);
            }
        }
        );
    }
}




export const chatEvent = new ChatEvent();
