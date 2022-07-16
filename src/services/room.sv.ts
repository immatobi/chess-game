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

    

}

export default new RoomService();