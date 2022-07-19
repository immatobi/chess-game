import mongoose, { ObjectId } from 'mongoose'
import slugify from 'slugify'
import { IChatDoc } from '../utils/types.util'

const ChatSchema = new mongoose.Schema (

    {

        chatID: {
            type: String
        },

        partyA: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        partyB: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        isRoom: {
            type: Boolean
        },

        game: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Game'
        },

        messages: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Message'
            }
        ]

    },

    {
        timestamps: true,
        versionKey: '_version',
        toJSON: {
            transform(doc, ret){
                ret.id = ret._id
            }
        }
    }

)

ChatSchema.set('toJSON', { getters: true, virtuals: true });

ChatSchema.pre<IChatDoc>('save', async function(next){
    next();
});


// define the model constant
const Chat = mongoose.model<IChatDoc>('Chat', ChatSchema);

export default Chat;
