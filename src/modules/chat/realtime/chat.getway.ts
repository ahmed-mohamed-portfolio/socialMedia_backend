
import { Server, Socket } from "socket.io";
import { ChatEvent } from "./chat.event";


export class ChatGateway {


    private chatEvent: ChatEvent;
    constructor() {


        this.chatEvent = new ChatEvent()
    }


    registerEvents = (socket: Socket, io: Server) => {


        this.chatEvent.sayHi(socket)
    }


}


export const chatGateway = new ChatGateway();
