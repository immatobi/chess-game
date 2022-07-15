import { arrayIncludes } from '@btffamily/checkaam';
import {ObjectId} from 'mongoose'
import Chat from '../models/Chat.model';
import Message from '../models/Message.model';
import Room from '../models/Room.model';
import { generate } from '../utils/random.util';
import { IResult, IChatMessage } from '../utils/types.util'

class ChatService {

    public result: IResult;

    constructor () {
        this.result = { error: false, message: '', data: null }
    }

    public async userChatExists(chats: Array<ObjectId>, chatId: ObjectId): Promise<boolean>{

        if(chats.length > 0){
            return arrayIncludes(chats, chatId.toString()) ? true : false
        }else{
            return false;
        }

    }

    public async roomChatExists(roomId:ObjectId | null, chatId: ObjectId): Promise<boolean>{

        const room = await Room.findOne({ _id: roomId });

        if(room){
            return room.chat.toString() === chatId.toString() ? true : false
        }else{
            return false;
        }

    }

    public async saveChatMessage(chatId: ObjectId, data: IChatMessage ): Promise<IResult>{

        const chat = await Chat.findOne({ _id: chatId });

        if(chat){

            const message = await Message.create({
                sender: data.sender,
                receiver: data.receiver,
                message: data.message,
                chat: chat._id
            });

            chat.messages.push(message._id);
            await chat.save();

            this.result.data = chat;

        }else{

            const gen = generate(6, false);
            const newChat = await Chat.create({
                chatID: gen.toString(),
                partyA: data.sender,
                partyB: data.receiver,
                isRoom: false,
            });

            const message = await Message.create({
                sender: data.sender,
                receiver: data.receiver,
                message: data.message,
                chat: newChat._id
            });

            newChat.messages.push(message._id);
            await newChat.save();

            this.result.data = chat;

        }

        return this.result;

    }

    public async saveRoomMessage(roomId: ObjectId, data: IChatMessage ): Promise<IResult>{

        const room = await Room.findOne({ _id: roomId });

        if(room){

            const chat = await Chat.findOne({ room: room._id });

            if(chat){

                const message = await Message.create({
                    sender: data.sender,
                    receiver: data.receiver,
                    message: data.message,
                    chat: chat._id
                });
    
                chat.messages.push(message._id);
                await chat.save();
    
                this.result.data = chat;
    
            }else{
    
                const gen = generate(6, false);
                const newChat = await Chat.create({
                    chatID: gen.toString(),
                    partyA: data.sender,
                    partyB: data.receiver,
                    isRoom: true,
                    room: room._id
                });
    
                const message = await Message.create({
                    sender: data.sender,
                    receiver: data.receiver,
                    message: data.message,
                    chat: newChat._id
                });
    
                newChat.messages.push(message._id);
                await newChat.save();

                room.chat = newChat._id;
                await room.save();
    
                this.result.data = chat;
    
            }
    
        }else{

            this.result.data = null;

        }

        
        return this.result;

    }

}

export default new ChatService();