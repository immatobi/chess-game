import { arrayIncludes } from '@btffamily/checkaam';
import {ObjectId} from 'mongoose'
import Chat from '../models/Chat.model';
import Game from '../models/Game.model';
import Message from '../models/Message.model';
import Room from '../models/Room.model';
import User from '../models/User.model';
import { generate } from '../utils/random.util';
import { IResult, IChatMessage, IMessage } from '../utils/types.util'

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

    public async processChat(data: IMessage): Promise<void> {

        const receiver = await User.findOne({ _id: data.receiver });
        const sender = await User.findOne({ _id: data.sender });

        if(receiver && sender){

            const saved = await this.saveChatMessage(data.chatId, { 
                sender: sender._id, 
                receiver: receiver._id, 
                message: data.message 
            });

            if(!this.userChatExists(sender.chats, saved.data._id) && 
            !this.userChatExists(receiver.chats, saved.data._id)){
                
                sender.chats.push(saved.data._id);
                await sender.save();

                receiver.chats.push(saved.data._id);
                await sender.save();
            }

        }

    }

    public async saveGameMessage(gameId: string, data: IChatMessage ): Promise<IResult>{

        const game = await Game.findOne({ gameID: gameId });

        if(game){

            const chat = await Chat.findOne({ game: game._id });

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
                    game: game._id
                });
    
                const message = await Message.create({
                    sender: data.sender,
                    receiver: data.receiver,
                    message: data.message,
                    chat: newChat._id
                });
    
                newChat.messages.push(message._id);
                await newChat.save();

                game.chat = newChat._id;
                await game.save();
    
                this.result.data = chat;
    
            }
    
        }else{

            this.result.data = null;

        }

        
        return this.result;

    }

}

export default new ChatService();