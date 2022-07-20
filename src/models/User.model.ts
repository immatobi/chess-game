import crypto from 'crypto';
import mongoose, { ObjectId } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import Role from './Role.model';

interface IUserModel {
    build(attrs: any): IUserDoc,
	getSignedJwtToken(): any,
	matchPassword(password: string): any,
	matchEmailCode(code: string): boolean,
	matchInviteLink(code: string): boolean,
	increaseLoginLimit(): number,
	checkLockedStatus(): boolean,
	getResetPasswordToken(): any,
	getActivationToken(): any,
	getInviteToken(): any;
	hasRole(role: any, roles: Array<ObjectId>): Promise<boolean>,
	findByEmail(email: string): IUserDoc,
}

interface IUserDoc extends IUserModel, mongoose.Document {

    firstName: string;
    lastName: string;
	phoneNumber: string;
	phoneCode: string;
	email: string;
	password: string;
	passwordType: string;
	savedPassword: string;
	userType: string;
	points: number;
	rank: string;
	username: string
	socketId: string | any;

	status: {
		profile: string,
		setup: number
	};

	activationToken: string | undefined;
	activationTokenExpire: Date | undefined;

	resetPasswordToken: string | undefined;
	resetPasswordTokenExpire: Date | undefined;

	emailCode: string | undefined;
	emailCodeExpire: Date | number | undefined;

	inviteToken: string | undefined;
	inviteTokenExpire: Date | undefined;

	isSuper: boolean;
	isActivated: boolean;
	isAdmin: boolean;
	isPlayer: boolean;
	isManager: boolean;
	isUser: boolean;

	isActive: boolean;
	loginLimit: number;
	isLocked: boolean;

	// relationships
	country: mongoose.Schema.Types.ObjectId | any;
	roles: Array<mongoose.Schema.Types.ObjectId | any>;
	chats: Array<ObjectId | any>;
	game: ObjectId | any;
    rooms: Array<ObjectId | any>;
	games:Array<ObjectId | any>;

    // time stamps
    createdAt: string;
    updatedAt: string;
	_version: number;
	_id: mongoose.Schema.Types.ObjectId;
	id: mongoose.Schema.Types.ObjectId;

	// props for the model
	build(attrs: any): IUserDoc,
	getSignedJwtToken(): any,
	matchPassword(password: string): any,
	matchEmailCode(code: string): boolean,
	matchInviteLink(link: string): boolean,
	increaseLoginLimit(): number,
	checkLockedStatus(): boolean,
	getResetPasswordToken(): any,
	getActivationToken(): any,
	getInviteToken(): any;
	hasRole(role: any, roles: Array<ObjectId>): Promise<boolean>,
	findByEmail(email: string): IUserDoc,

}

const UserSchema = new mongoose.Schema(

    {
        firstName: {
            type: String,
			default: 'Champ'
        },
 
        lastName: {
            type: String
        },

		username:{
			type: String,
			unique: [true, 'username already exist'],
			required: [true, 'username is required']
		},

        phoneNumber: {
			type: String
		},

		phoneCode: {
			type: String
		},

        email: {
			type: String,
			required: [true, 'email is required'],
			unique: [true, 'email already exist'],
			match: [
				/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
				'a valid email is required',
			],
		},

        password: {
			type: String,
			required: [true, 'password is required'],
			minlength: [8, 'Password cannot be less than 8 characters'],
			select: false,
		},

		passwordType: {
			type: String,
			enum: ['generated', 'self', 'self-changed'],
			select: true,
		},

		savedPassword: {
			type: String
		},

		userType: {
			type: String,
			enum: ['superadmin','admin','player','manager','user']
		},

		status: {

			profile: {
				type: String,
				enum: ['updated', 'pending'],
				default: 'pending'
			},

			setup: {
				type: Number,
				default: 0
			},

		},

		points: {
			type: Number,
			default: 1000
		},

		rank: {
			type: String,
			enum: ['beginner', 'intermediate', 'advanced', 'expert'],
			default: 'beginner'
		},

		socketId: {
			type: mongoose.Schema.Types.Mixed
		},

        activationToken: String,
		activationTokenExpire: Date,

		resetPasswordToken: String,
		resetPasswordTokenExpire: Date,

		emailCode: String,
		emailCodeExpire: Date,

		inviteToken: String,
		inviteTokenExpire: Date,

        isSuper: {
			type: Boolean,
			default: false
		},

        isActivated: {
			type: Boolean,
			default: false
		},

        isAdmin: {
			type: Boolean,
			default: false
		},

		isPlayer: {
			type: Boolean,
			default: false
		},

		isManager: {
			type: Boolean,
			default: false
		},

		isUser: {
			type: Boolean,
			default: false
		},

		isActive: {
			type: Boolean,
			default: false
		},

        loginLimit: {
			type: Number,
			default: 0
		},

		isLocked: {
			type: Boolean,
			default: false
		},

        country: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Country',
		},

		game: {
			type: mongoose.Schema.Types.Mixed,
			ref: 'Game',
		},

		rooms: {
			type: mongoose.Schema.Types.Mixed,
			ref: 'Room',
		},

        roles: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Role',
				required: true,
			},
		],

		chats: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Chat'
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

UserSchema.set('toJSON', {getters: true, virtuals: true});

// Encrypt password using bcrypt
UserSchema.pre<IUserDoc>('save', async function (next) {
	
	if (!this.isModified('password')) {
		return next();
	}

	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);

	next()
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
	return jwt.sign({ id: this._id, email: this.email, roles: this.roles }, process.env.JWT_SECRET as string, {
		expiresIn: process.env.JWT_EXPIRE,
	});
};

// Match user password
UserSchema.methods.matchPassword = async function (pass: any) {
	return await bcrypt.compare(pass, this.password);
};

// Match email verification code
UserSchema.methods.matchEmailCode = function (code: any) {
	return this.emailCode === code ? true : false;
}

// increase login limit
UserSchema.methods.increaseLoginLimit = function () {
	const limit = this.loginLimit + 1
	return limit;
}

// check locked status
UserSchema.methods.checkLockedStatus = function () {
	return this.isLocked;
}

//Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
	// Generate token
	const resetToken = crypto.randomBytes(20).toString('hex');

	// Hash the token and set to resetPasswordToken field
	this.resetPasswordToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');

	// Set expire
	this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

	return resetToken;
};

//Generate and hash activation token
UserSchema.methods.getActivationToken = function () {
	// Generate token
	const token = crypto.randomBytes(20).toString('hex');

	// Hash the token and set to resetPasswordToken field
	this.activationToken = crypto
		.createHash('sha256')
		.update(token)
		.digest('hex');

	// Set expire
	this.activationTokenExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

	return token;
};

//Generate and hash invite token
UserSchema.methods.getInviteToken = function () {
	// Generate token
	const token = crypto.randomBytes(20).toString('hex');

	// Hash the token and set to resetPasswordToken field
	this.inviteToken = crypto
		.createHash('sha256')
		.update(token)
		.digest('hex');

	// Set expire
	this.inviteTokenExpire = Date.now() + 1440 * 60 * 1000; // 24 hours

	return token;
};

// Find out if user has a role
UserSchema.methods.hasRole = async (name: any, roles: Array<ObjectId>): Promise<boolean> => {

	let flag = false;

	const _role = await Role.findOne({ name: name });

	for (let i = 0; i < roles.length; i++) {
		if (roles[i].toString() === _role?._id.toString()) {
			flag = true;
			break;
		}
	}

	return flag;
};

UserSchema.statics.findByEmail = (email) => {
	return User.findOne({ email: email });
};

// this function helps us to check with typescript
UserSchema.statics.build = (attrs: any) => {
    return new User(attrs)
}

// define the model
const User = mongoose.model<IUserDoc>('User', UserSchema);

export default User;