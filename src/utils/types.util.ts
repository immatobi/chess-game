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

export interface IRoomDoc extends Document{

    name: string;
    roomID: string;
    description: string;
    slug: string;
    password: string;
    gameLimit: number;

    manager: ObjectId | any;
    owner: ObjectId | any;
    members: Array<ObjectId | any>;
    games: Array<ObjectId | any>;
    chat: ObjectId | any;

    // time stamps
    createdAt: string;
    updatedAt: string;
    _version: number;
    _id: mongoose.Schema.Types.ObjectId;
    id: mongoose.Schema.Types.ObjectId;

    // functions
    findByName(name: string): IRoleDoc;
    getAllRooms(): any

}

export interface IGameDoc extends Document{

    name: string;
    gameID: string;
    description: string;
    slug: string;
    playersCount: number;

    manager: ObjectId | any;
    owner: ObjectId | any;
    members: Array<ObjectId | any>;
    playerA: ObjectId | any;
    playerB: ObjectId | any;
    chat: ObjectId | any;
    room: ObjectId | any;

    // time stamps
    createdAt: string;
    updatedAt: string;
    _version: number;
    _id: mongoose.Schema.Types.ObjectId;
    id: mongoose.Schema.Types.ObjectId;

    // functions
    findByName(name: string): IRoleDoc;
    getAllRooms(): any

}

export interface IChatDoc extends Document{

    chatID: string;
    isRoom: boolean;

    game: ObjectId | any;
    partyA: ObjectId | any;
    partyB: ObjectId | any;

    messages: Array<ObjectId | any>;

    // time stamps
    createdAt: string;
    updatedAt: string;
    _version: number;
    _id: mongoose.Schema.Types.ObjectId;
    id: mongoose.Schema.Types.ObjectId;
    
}

export interface IMessageDoc extends Document{

    message: string;

    sender: ObjectId | any;
    receiver: ObjectId | any;
    chat: ObjectId | any;

    // time stamps
    createdAt: string;
    updatedAt: string;
    _version: number;
    _id: ObjectId;
    id: ObjectId;

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
    rank: string;
    username: string;
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
	country: ObjectId | any;
	roles: Array<ObjectId | any>;
    chats: Array<ObjectId | any>;
	kyc: ObjectId | any;
	verification: ObjectId | any;
    game: ObjectId | any;
    rooms: Array<ObjectId | any>;
    games:Array<ObjectId | any>;

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

export interface IMessage {
    sender: ObjectId,
    receiver: ObjectId,
    message: string,
    type: string,
    chatId: string,
    gameId: string
}

export interface IChatMessage {
    sender: ObjectId,
    receiver: ObjectId,
    message: string
}

export interface IGameData {
    gameId: string,
    socketId: string
}

