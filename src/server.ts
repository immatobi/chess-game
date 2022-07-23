import app from './config/app.config'
import colors, { red } from 'colors'
import { seedData } from './config/seeds/seeder.seed'
import connectDB from './config/db.config'
import { getMemoryStats } from './utils/memory.util'
import { unlockUserAccounts, syncAdminDetails, syncAllUsers } from './crontab/user.cron'
import UserService from './services/user.sv'
import { Server } from 'socket.io';
import {ObjectId} from 'mongoose'
import User from './models/User.model'
import redis from './middleware/redis.mw'
import { CacheKeys } from './utils/cache.util'
import { IGameData, IMessage } from './utils/types.util'
import ChatService from './services/chat.sv'
import * as http from 'http'
import RoomService from './services/room.sv'

const connect = async (): Promise<void> => {

    // connect to DB
    await connectDB();

    // get heap statistics and log heap size 
    const heapSize = getMemoryStats()
    console.log(heapSize);

    // seed data
    await seedData();
    
    // start job automatically //

    // unlock user accounts: run every 0 seconds of every 30th minute of every hour of every day of month of every month of every day of week
    unlockUserAccounts('0 */29 * * * *');

}

connect();  // initialize connection and seed data

// create server
const server = http.createServer(app);

// define PORT
const PORT = process.env.PORT || 5000;

// define socket server
const ioServer = new Server(server, { 
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE']
    },
    allowEIO3: true,
    pingTimeout: 6000
 });

ioServer.on('connection', (socket) => {

    console.log(colors.yellow.inverse('connected to socket io'));
    let socketId = socket.id;

    // connect user
    socket.on("user-connected", async (userId: ObjectId) => {

       await UserService.addSocketUser(socketId, userId);

    })

    // join game
    socket.on('join-game', async (data: IGameData) => {

        await socket.join(data.gameId);
        await UserService.addUserGame(data.gameId, data.socketId)

        // communicate
        const user = await redis.fetchData(data.socketId);
        socket.to(data.gameId).emit("user-joined", { _id: user._id, socketId: data.socketId })

    });

    // leave game
    socket.on('leave-game', async (data: IGameData) => {

        await socket.leave(data.gameId);
        await UserService.removeUserGame(data.gameId, data.socketId);

        // communicate
        const user = await redis.fetchData(data.socketId);
        socket.to(data.gameId).emit("user-left", { _id: user._id, socketId: data.socketId })

    });

    // (chat)
    socket.on('send-message', async (data: IMessage) => {

        if(data.type === 'private'){

            const recSoc = await redis.fetchData(data.receiver.toString()); // get socket id from cache

            // publish the message first
            await socket.to(recSoc).emit("receive-message", {
                sender: data.sender,
                receiver: data.receiver,
                message: data.message
            })

            await ChatService.processChat(data);

        }

        else if(data.type === 'game'){

            // publish the message first
            await socket.to(data.gameId).emit("game-message", {
                sender: data.sender,
                receiver: data.receiver,
                message: data.message
            })

            await ChatService.saveGameMessage(data.gameId, { 
                sender: data.sender,
                receiver: data.receiver,
                message: data.message
            })

        }

        // else{

        //     socket.broadcast.emit("global-message", {
        //         sender: data.sender,
        //         message: data.message
        //     });

        // }


    });

    // get room and games
    socket.on('get-room', async (roomId: string) => {
        const room = await RoomService.pullRoomAndGames(roomId);
        socket.emit("room-data-open", room);
    })

    // disconnect
    socket.on("disconnect", async () => {

        socket.emit("user-disconnected", {});

    })

})

server.listen(PORT, () => {
    console.log(colors.yellow.bold(`Chess server running in ${process.env.NODE_ENV} on port ${PORT}`));
});

// catch unhandled promise rejections
process.on('unhandledRejection', (err: any, promise) => {
    console.log(colors.red(`err: ${err.message}`));
    server.close(() => process.exit(1));
})

