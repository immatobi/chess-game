import app from './config/app.config'
import colors from 'colors'
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
import { IMessage } from './utils/types.util'
import ChatService from './services/chat.sv'
import * as http from 'http'

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
const ioServer = new Server(server);

ioServer.on('connection', (socket) => {

    console.log(colors.yellow.inverse('connected to socket io'));
    let socketId = socket.id;

    // connect user
    socket.on("user-connected", async (userId: ObjectId, roomId: ObjectId | null = null) => {

        if(roomId !== null){

            socket.join(roomId.toString());
            UserService.addSocketUser(socketId, userId, roomId);

            // emit total number of users
            const total = await redis.fetchData(CacheKeys.TotalPlayers);
            socket.emit('get-total-users', parseInt(total));

        }

        

    })

    // send message (chat)
    socket.on('send-message', async (data: IMessage) => {

        const receiver = await User.findOne({ _id: data.receiver });
        const sender = await User.findOne({ _id: data.sender });

        if(sender && receiver){

            if(data.type === 'private'){

                const saved = await ChatService.saveChatMessage(data.chatId, { 
                    sender: sender._id, 
                    receiver: receiver._id, 
                    message: data.message 
                });

                if(!ChatService.userChatExists(sender.chats, saved.data._id) && 
                !ChatService.userChatExists(receiver.chats, saved.data._id)){
                    
                    sender.chats.push(saved.data._id);
                    await sender.save();

                    receiver.chats.push(saved.data._id);
                    await sender.save();
                }

                socket.to(receiver.socketId).emit("receive-message", {
                    sender: sender._id,
                    message: data.message
                })

            }
            
            else if(data.type === 'room'){

                await ChatService.saveRoomMessage(data.roomId, { 
                    sender: sender._id, 
                    receiver: receiver._id, 
                    message: data.message 
                });

                socket.to(data.roomId.toString()).emit("receive-message", {
                    sender: sender._id,
                    message: data.message
                })

            }
            
            else{

                socket.broadcast.emit("receive-message", {
                    sender: sender._id,
                    message: data.message
                });

            }

        }

    });

    socket.on("disconnect", async () => {

        const data = await redis.fetchData(socketId);
        
        if(data !== null){

            UserService.removeSocketUser(socketId, data._id, data.room)

            // emit total number of users
            const total = await redis.fetchData(CacheKeys.TotalPlayers);
            socket.emit('get-total-users', parseInt(total));

        }

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

