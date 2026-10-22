
import { Server, Socket } from 'socket.io';
import { redisService, RedisService } from './../../common/services/redis.service';
import { TokenService } from './../../common/services/token.service';
import { Server as HttpServerType } from "node:http"
import { JwtPayload } from 'jsonwebtoken';
import { chatGateway } from '../chat';


export class RealTimeGateway {


    private io!: Server
    private tokenService: TokenService
    constructor() {
        this.tokenService = new TokenService()
    }


    authentication = async (socket: Socket, next: any) => {

        // console.log("socket.handshake", socket.handshake);

        try {

            let user = await this.tokenService.decodeToken(socket.handshake.auth.authorization) as JwtPayload

            socket.data = user

            await redisService.addSocket(user.id, socket.id)

            next()
        } catch (error) {
            next(error)
        }
    }


    InitializeIo = (httpServer: HttpServerType) => {
        this.io = new Server(httpServer, {
            cors: {
                origin: 'http://localhost:4200',
                credentials: true
            }
        })


        //middleware
        this.io.of('/').use(this.authentication)


        this.io.on('connection', async (socket: Socket) => {


            chatGateway.registerEvents(socket, this.io)


            socket.on('disconnect', async () => {

                let userId = socket.data.id

                let removeSocket = await redisService.removeSocket(userId, socket.id)
                // console.log("redisService.removeSocket", removeSocket);


                let connections = await redisService.getSockets(userId) || []
                // console.log("connections", connections, connections.length);


                if (connections.length < 1) {
                    this.io.emit("offline_user", { userId })
                }
            })



        })
    }
}






export const realTimeGateway = new RealTimeGateway()



