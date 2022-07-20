import { arrayIncludes } from '@btffamily/checkaam';
import {ObjectId} from 'mongoose'
import Chat from '../models/Chat.model';
import Message from '../models/Message.model';
import Room from '../models/Room.model';
import { generate } from '../utils/random.util';
import { IResult, IChatMessage } from '../utils/types.util'

class RoomService {

    public result: IResult;

    constructor () {
        this.result = { error: false, message: '', data: null }
    }

    public async pullRoomAndGames(roomId: string): Promise<IResult>{

        const room = await Room.findOne({ roomID: roomId }).populate([
            { path: 'manager' },
            { path: 'owner' },
            { path: 'games' },
            { path: 'members', select: '_id username' }
        ]);

        if(room){
            this.result.data = room;
        }else{
            this.result.error = true;
            this.result.message = 'room does not exist'
        }

        return this.result;

    }

}

export default new RoomService();