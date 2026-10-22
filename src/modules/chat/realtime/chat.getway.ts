
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
    }


}


export const chatGateway = new ChatGateway();
