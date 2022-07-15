import mongoose, { ObjectId, Document } from 'mongoose'

// models

export interface IAnnouncementDoc extends Document{

    title: string;
    description: string;
    content: string;
    thumbnail: string;
    position: number;
    slug: string;
    isEnabled: boolean;

    user: ObjectId

    // time stamps
    createdAt: string;
    updatedAt: string;
    _version: number;
    _id: ObjectId;
    id: ObjectId;

    // functions
    getAllAnnouncements(): any


}

export interface ICountryDoc extends Document {
    name: string;
    code2: string;
    code3: string;
    capital: string;
    region: string;
    subRegion: string;
    currencyCode: string;
    currencyImage: string;
    phoneCode: string;
    flag: string;
    states: Array<object>;
    slug: string;
    users: Array<ObjectId>;

    // props
    build(attrs: any): ICountryDoc;
}

export interface IKycDoc extends Document{

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

    country: ObjectId;
    user: ObjectId;

    // time stamps
    createdAt: string;
    updatedAt: string;
    _version: number;
    _id: ObjectId;
    id: ObjectId;

    // functions
    getAllKycs(): any


}

export interface IRoleDoc extends Document{

    name: string;
    description: string;
    slug: string;
    resources: Array<ObjectId | any>;
    users: Array<ObjectId | any>;

    // time stamps
    createdAt: string;
    updatedAt: string;
    _version: number;
    _id: ObjectId;
    id: ObjectId;

    // functions
    findByName(name: string): IRoleDoc;
    getRoleName(id: ObjectId): IRoleDoc;
    getAllRoles(): any


}

export interface IVerificationDoc extends Document{

    basic: string;
    ID: string;
    face: string;
    address: string;
    sms: boolean;
    email: boolean;

    user: ObjectId;

    // time stamps
    createdAt: string;
    updatedAt: string;
    _version: number;
    _id: ObjectId;
    id: ObjectId;

    // functions
    getAllVerifications(): any


}

export interface IUserDoc extends Document {

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
	country: ObjectId | any;
	roles: Array<ObjectId | any>;
	kyc: ObjectId | any;
	verification: ObjectId | any;

    // time stamps
    createdAt: string;
    updatedAt: string;
	_version: number;
	_id: ObjectId;
	id: ObjectId;

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

export interface IPagination {
	total: number,
	pagination: {
		next: { page: number, limit: number },
		prev: { page: number, limit: number },
	},
	data: Array<any>
}

export interface IResult {
    error: boolean,
    message: string,
    data: any
}

export interface IBasicKyc {
    firstName: string, 
    lastName: string, 
    middleName: string,  
    dob: string | number, 
    gender: string, 
    age: boolean
}

export interface IAddressKyc {
    country: ObjectId, 
    city: string, 
    state: string,  
    address: string,
    postalCode: string, 
    utilityDoc: string, 
}

