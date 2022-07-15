import mongoose, { ObjectId } from 'mongoose'
import slugify from 'slugify'
import { IMessageDoc } from '../utils/types.util'

const MessageSchema = new mongoose.Schema (

    {

        message: {
            type: String
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat'
        }

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

MessageSchema.set('toJSON', { getters: true, virtuals: true });

MessageSchema.pre<IMessageDoc>('save', async function(next){
    next();
});


// define the model constant
const Message = mongoose.model<IMessageDoc>('Message', MessageSchema);

export default Message;
