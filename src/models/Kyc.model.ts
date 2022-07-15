import mongoose, { ObjectId } from 'mongoose'
import slugify from 'slugify'

// interface that describes the properties the model has
interface IKycModel{

    // functions
    getAllKycs(): any

}

// interface that describes the properties that the Doc has
interface IKycDoc extends IKycModel, mongoose.Document{

    firstName: string;
    lastName: string;
    middleName: string;
    dob: Date | number | string;
    gender: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    utilityDoc: string;
    idType: string;
    idData: { front: string, back: string };
    faceId: string;
    isAdult: boolean;
    slug: string;

    country: mongoose.Schema.Types.ObjectId;
    user: mongoose.Schema.Types.ObjectId;

    // time stamps
    createdAt: string;
    updatedAt: string;
    _version: number;
    _id: mongoose.Schema.Types.ObjectId;
    id: mongoose.Schema.Types.ObjectId;

    // functions
    getAllKycs(): any


}

const KycSchema = new mongoose.Schema (

    {

        firstName: {
            type: String
        },

        lastName: {
            type: String
        },

        middleName: {
            type: String
        },

        dob: {
            type: mongoose.Schema.Types.Mixed
        },

        address: {
            type: String
        },

        city: {
            type: String
        },

        state: {
            type: String
        },

        postalCode: {
            type: String
        },

        utilityDoc: {
            type: String
        },

        idType: {
            type: String,
            enum: ['card','passport','license']
        },

        idData: {
            front: {
                type: String
            },
            back: {
                type: String
            }
        },

        faceId: {
            type: String
        },

        gender: {
            type: String,
            enum: ['male', 'female']
        },

        isAdult: {
            type: Boolean
        },

        slug: String,

        country: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Country'
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

KycSchema.set('toJSON', { getters: true, virtuals: true });

KycSchema.pre<IKycDoc>('save', async function(next){
    this.slug = slugify(this.firstName, { lower: true });
    next();
});

KycSchema.statics.getAllKycs = () => {
    return Kyc.find({});
}

// define the model constant
const Kyc = mongoose.model<IKycDoc>('Kyc', KycSchema);

export default Kyc;
