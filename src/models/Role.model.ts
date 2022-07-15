import mongoose, { ObjectId } from 'mongoose'
import slugify from 'slugify'

// interface that describes the properties the model has
interface IRoleModel{

    // functions
    findByName(name: string): IRoleDoc;
    getRoleName(id: ObjectId): IRoleDoc;
    getAllRoles(): any

}

// interface that describes the properties that the Doc has
interface IRoleDoc extends IRoleModel, mongoose.Document{

    name: string;
    description: string;
    slug: string;
    resources: Array<mongoose.Schema.Types.ObjectId | any>;
    users: Array<mongoose.Schema.Types.ObjectId | any>;

    // time stamps
    createdAt: string;
    updatedAt: string;
    _version: number;
    _id: mongoose.Schema.Types.ObjectId;
    id: mongoose.Schema.Types.ObjectId;

    // functions
    findByName(name: string): IRoleDoc;
    getRoleName(id: ObjectId): IRoleDoc;
    getAllRoles(): any


}

const RoleSchema = new mongoose.Schema (

    {

        name: {
            type: String,
            required: [true, 'please add a role name']
        },

        description: {
            type: String,
            required: [true, 'please add a role description'],
            maxlength: [255, 'role description cannot be more than 255 characters']
        },

        slug: String,

        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],

        resources: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Resource'
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

RoleSchema.set('toJSON', { getters: true, virtuals: true });

RoleSchema.pre<IRoleDoc>('save', async function(next){
    this.slug = slugify(this.name, { lower: true });
    next();
});

RoleSchema.statics.findByName = (roleName) => {
    return Role.findOne({name: roleName});
}

RoleSchema.statics.getRoleName = (roleId) => {
    return Role.findById(roleId);
}

RoleSchema.statics.getAllRoles = () => {
    return Role.find({});
}

// define the model constant
const Role = mongoose.model<IRoleDoc>('Role', RoleSchema);

export default Role;
