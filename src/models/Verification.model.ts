import mongoose, { ObjectId } from 'mongoose'
import slugify from 'slugify'

// interface that describes the properties the model has
interface IVerificationModel{

    // functions
    getAllVerifications(): any

}

// interface that describes the properties that the Doc has
interface IVerificationDoc extends IVerificationModel, mongoose.Document{

    basic: string;
    ID: string;
    face: string;
    address: string;
    sms: boolean;
    email: boolean;

    user: mongoose.Schema.Types.ObjectId;

    // time stamps
    createdAt: string;
    updatedAt: string;
    _version: number;
    _id: mongoose.Schema.Types.ObjectId;
    id: mongoose.Schema.Types.ObjectId;

    // functions
    getAllVerifications(): any


}

const VerificationSchema = new mongoose.Schema (

    {

        basic: {
            type: String,
            enum: ['pending','submitted', 'approved'],
            default: 'pending'
        },

        ID: {
            type: String,
            enum: ['pending','submitted', 'approved'],
            default: 'pending'
        },

        face: {
            type: String,
            enum: ['pending','submitted', 'approved'],
            default: 'pending'
        },

        address: {
            type: String,
            enum: ['pending','submitted', 'approved'],
            default: 'pending'
        },

        sms: {
            type: Boolean,
            default: false
        },

        email: {
            type: Boolean,
            default: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
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

VerificationSchema.set('toJSON', { getters: true, virtuals: true });

VerificationSchema.pre<IVerificationDoc>('save', async function(next){
    next();
});

VerificationSchema.statics.getAllVerifications = () => {
    return Verification.find({});
}

// define the model constant
const Verification = mongoose.model<IVerificationDoc>('Verification', VerificationSchema);

export default Verification;
