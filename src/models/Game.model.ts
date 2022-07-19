import mongoose, { ObjectId } from 'mongoose'
import slugify from 'slugify'
import { IGameDoc } from '../utils/types.util'

const GameSchema = new mongoose.Schema (

    {

        name: {
            type: String,
            required: [true, 'please add a game name']
        },

        description: {
            type: String,
            required: [true, 'please add a game description'],
            maxlength: [500, 'game description cannot be more than 255 characters']
        },

        slug: String,

        gameID: {
            type: String
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

        playerA: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        playerB: {
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

GameSchema.set('toJSON', { getters: true, virtuals: true });

GameSchema.pre<IGameDoc>('save', async function(next){
    this.slug = slugify(this.name, { lower: true });
    next();
});

GameSchema.statics.findByName = (roleName) => {
    return Game.findOne({name: roleName});
}

GameSchema.statics.getAllGames = () => {
    return Game.find({});
}

// define the model constant
const Game = mongoose.model<IGameDoc>('Game', GameSchema);

export default Game;
