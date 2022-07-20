import mongoose, { ObjectId } from 'mongoose'
import slugify from 'slugify'
import { IRoomDoc } from '../utils/types.util'

const RoomSchema = new mongoose.Schema (

    {

        name: {
            type: String,
            required: [true, 'please add a room name']
        },

        description: {
            type: String,
            required: [true, 'please add a room description'],
            maxlength: [500, 'role description cannot be more than 255 characters']
        },

        slug: String,

        roomID: {
            type: String
        },

        gameLimit: {
            type: Number,
            default: 10
        },

        password: {
            type: String,
            select: false
        },

        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],

        games: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Game'
            }
        ],

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

RoomSchema.set('toJSON', { getters: true, virtuals: true });

RoomSchema.pre<IRoomDoc>('save', async function(next){
    this.slug = slugify(this.name, { lower: true });
    next();
});

RoomSchema.statics.findByName = (roleName) => {
    return Room.findOne({name: roleName});
}

RoomSchema.statics.getAllRooms = () => {
    return Room.find({});
}

// define the model constant
const Room = mongoose.model<IRoomDoc>('Room', RoomSchema);

export default Room;
