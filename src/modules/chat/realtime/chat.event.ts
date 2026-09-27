
import { Socket } from "socket.io";
import { ChatService } from "../chat.services";
import { SocketValidation } from "../../../middleware/validation.middleware";
import * as validators from '../chat.validation'




export class ChatEvent {


    private chatService: ChatService


    constructor() {
        this.chatService = new ChatService();
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


}




export const chatEvent = new ChatEvent();
