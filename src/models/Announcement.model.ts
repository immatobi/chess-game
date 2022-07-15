import mongoose, { ObjectId } from 'mongoose'
import slugify from 'slugify'

// interface that describes the properties the model has
interface IAnnouncementModel{

    // functions
    getAllAnnouncements(): any

}

// interface that describes the properties that the Doc has
interface IAnnouncementDoc extends IAnnouncementModel, mongoose.Document{

    title: string;
    description: string;
    content: string;
    thumbnail: string;
    position: number;
    slug: string;
    isEnabled: boolean;

    user: mongoose.Schema.Types.ObjectId

    // time stamps
    createdAt: string;
    updatedAt: string;
    _version: number;
    _id: mongoose.Schema.Types.ObjectId;
    id: mongoose.Schema.Types.ObjectId;

    // functions
    getAllAnnouncements(): any


}

const AnnouncementSchema = new mongoose.Schema (

    {

        title: {
            type: String,
            required: [true, 'title is required'],
            maxlength: [150, 'title cannot be more than 150 characters']
        },

        description: {
            type: String,
            required: [true, 'description is required'],
            maxlength: [300, 'description cannot be more than 300 characters']
        },

        content: {
            type: String,
            maxlength: [1000, 'content cannot be more than 1000 characters']
        },

        thumbnail: {
            type: String,
        },

        position: {
            type: Number,
        },

        isEnabled: {
            type: Boolean,
        },

        slug: String,

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

AnnouncementSchema.set('toJSON', { getters: true, virtuals: true });

AnnouncementSchema.pre<IAnnouncementDoc>('save', async function(next){
    this.slug = slugify(this.title, { lower: true });
    next();
});

AnnouncementSchema.statics.getAllAnnouncements = () => {
    return Announcement.find({});
}

// define the model constant
const Announcement = mongoose.model<IAnnouncementDoc>('Announcement', AnnouncementSchema);

export default Announcement;
