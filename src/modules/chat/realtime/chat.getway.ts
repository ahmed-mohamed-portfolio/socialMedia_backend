
import { Server, Socket } from "socket.io";
import { ChatEvent } from "./chat.event";


export class ChatGateway {


    private chatEvent: ChatEvent;
    constructor() {


        this.chatEvent = new ChatEvent()
    }


    registerEvents = (socket: Socket, io: Server) => {


        this.chatEvent.sayHi(socket)
        this.chatEvent.sendMessage(socket, io)
        this.chatEvent.usersInChat(socket)
        this.chatEvent.checkStatus(socket)

        //not test in front yet
        this.chatEvent.sendGroupMessage(socket, io)
        this.chatEvent.join_room(socket, io)

    }


}


export const chatGateway = new ChatGateway();
