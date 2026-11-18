
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

            try {


                const userId = socket.data.id;

                // 1. Check previous sockets
                const oldSockets = await redisService.getSockets(userId);

                // 2. Register new socket
                await redisService.addSocket(userId, socket.id);

                // 3. Notify only when user becomes online
                if (oldSockets.length === 0) {
                    this.io.emit("online_user", { userId });
                }

                // 4. Register chat events
                chatGateway.registerEvents(socket, this.io)


                socket.on('disconnect', async () => {
                    try {


                        let userId = socket.data.id

                        let removeSocket = await redisService.removeSocket(userId, socket.id)
                        // console.log("redisService.removeSocket", removeSocket);


                        let connections = await redisService.getSockets(userId) || []
                        // console.log("connections", connections, connections.length);


                        // Explanation: Checks whether the user had no active socket connections before adding the new one, ensuring that the online_user event is emitted only when the user transitions from offline to online.
                        // Example: Ahmed opens the website for the first time, triggering online_user. Opening it on another device won't trigger the event again because he's already online.
                        if (connections.length < 1) {
                            this.io.emit("offline_user", { userId })
                        }

                    } catch (error) {
                        console.error("Disconnect error:", error);

                    }
                })


                // Explanation: Checks whether the socket disconnected during asynchronous operations (await) and removes its ID from Redis to prevent an offline user from being incorrectly marked as online.
                // Example: Ahmed opens the website and quickly closes it while Redis is registering his socket. The condition detects the disconnection and removes the socket from Redis.
                if (!socket.connected) {
                    await redisService.removeSocket(userId, socket.id);
                }

            } catch (error) {
                console.error("Connection setup error:", error);

                // Explanation: Forcefully disconnects the socket from the server and closes its underlying connection, typically when an error prevents the connection setup from completing successfully.
                // Example: Ahmed connects to the server, but Redis fails to register his socket. The server calls socket.disconnect(true) to terminate the incomplete connection.
                socket.disconnect(true);
            }
        })
    }
}






export const realTimeGateway = new RealTimeGateway()



