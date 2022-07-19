import { IResult } from '../utils/types.util'
import { ObjectId } from 'mongoose'
import User from '../models/User.model';
import { sendGrid } from '../utils/email.util';
import Axios from 'axios'

import nats from '../events/nats'
import UserCreated from '../events/publishers/user-created'
import Room from '../models/Room.model';
import redis from '../middleware/redis.mw';
import { CacheKeys } from '../utils/cache.util';

class UserService {

    public result: IResult;

    constructor () {
        this.result = { error: false, message: '', data: null }
    }

    public async sendAccountEmail(id: ObjectId, business: string, callback: string): Promise<IResult>{

        const user = await User.findOne({ _id: id });

        if(user){

            let emailData = {
                template: 'welcome',
                email: user.email,
                preheaderText: 'Checkaam Invitation - Welcome',
                emailTitle: 'Checkaam Invitation - Welcome',
                emailSalute: 'Hello ' + user.firstName ? user.firstName : 'Champ' + ',',
                bodyOne: `
                    A Checkaam account has been created for you ${user.userType === 'customer' && business !== '' ? 'by ' + business : 'based on your order'}.
                    Please, use the login details below to access your dashboard, track your orders and more.
                `,
                bodyTwo: `Email: ${user.email} and Password: ${user.savedPassword}`,
                buttonUrl: `${callback}`,
                buttonText: 'Access Dashboard',
                fromName: process.env.FROM_NAME
            }

            await sendGrid(emailData);

            this.result.error = false;
            this.result.message = 'email sent successfully';

        }

        return this.result;

    }

    public async publishAllUsers(): Promise<void>{

        const users = await User.find({ isActive: true, isLocked: false });

        if(users && users.length > 0){

            for(let i = 0; i < users.length; i++){

                const user = users[i];

                setTimeout(async () => {

                    await new UserCreated(nats.client).publish({ 
                        user: user, 
                        userType: user.userType, 
                        phoneCode: '+' + user.phoneCode,
                        callback: process.env.CHECKAAM_STORE_URL,
                        account: 'all'
                    })

                }, 8000)

            }

        }

    }

    public async addSocketUser(socketId: string, userId: ObjectId, roomId: ObjectId | null): Promise<IResult>{

        const user = await User.findOne({ _id: userId });
        const room = await Room.findOne({ _id: roomId });

        if(user && !room){
            user.socketId = socketId;
            user.room = room;
            await user.save();

            // cache the new user with socket id // 180 days
            await redis.keepData({
                key: socketId,
                value: user
            }, 15552000);
        }

        if(user && room){

            user.room = room._id;
            await user.save();

            room.players.push(user._id);
            await room.save();

            // cache the new user with socket id // 180 days
            await redis.keepData({
                key: socketId,
                value: user
            }, 15552000);

            // get current total 
            const total = await redis.fetchData(CacheKeys.TotalPlayers);

            // update total users online // 180 days
            await redis.keepData({
                key: CacheKeys.TotalPlayers,
                value: ( parseInt(total) + 1 )
            }, 15552000)

        }

        return this.result;

    }

    public async removeSocketUser(socketId: string, userId: ObjectId, roomId: ObjectId): Promise<IResult>{

        const user = await User.findOne({ _id: userId });
        const room = await Room.findOne({ _id: roomId });

        if(user && !room){

            // remove user data from redis
            await redis.deleteData(socketId);

            // get current total 
            const total = await redis.fetchData(CacheKeys.TotalPlayers);

            // update total users online // 180 days
            await redis.keepData({
                key: CacheKeys.TotalPlayers,
                value: ( parseInt(total) - 1 )
            }, 15552000)

        }

        if(user && room){

            user.room = null;
            await user.save();

            const index = room.players.findIndex((p) => p.toString() === user._id.toString());
            room.players.splice(index, 1);
            await room.save();

            // remove user data from redis
            await redis.deleteData(socketId);

            // get current total 
            const total = await redis.fetchData(CacheKeys.TotalPlayers);

            // update total users online // 180 days
            await redis.keepData({
                key: CacheKeys.TotalPlayers,
                value: ( parseInt(total) - 1 )
            }, 15552000)

        }

        return this.result;

    }

}

export default new UserService();