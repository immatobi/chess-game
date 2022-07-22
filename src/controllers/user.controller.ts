import crypto from 'crypto';
import mongoose, { ObjectId, Model } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import ErrorResponse from '../utils/error.util';
import { sendGrid } from '../utils/email.util';
import { asyncHandler, strIncludesEs6, arrayIncludes, isString } from '@btffamily/checkaam'
import { generate } from '../utils/random.util';
import { seedData } from '../config/seeds/seeder.seed';
import { uploadBase64File } from '../utils/google.util'
import { IBasicKyc, IAddressKyc } from '../utils/types.util'
import StorageService from '../services/storage'
import UserService from '../services/user.sv'

import dayjs from 'dayjs';
import customparse from 'dayjs/plugin/customParseFormat';
dayjs.extend(customparse);

// models
import User from '../models/User.model'
import Role from '../models/Role.model'
import Chat from '../models/Chat.model';


// @desc           Get all users
// @route          GET /api/v1/users
// @access         Private
export const getUsers = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {
	res.status(200).json(res.advancedResults);   
})


// @desc    Get a user
// @route   GET /api/v1/users/:id
// @access  Private/Superadmin/Admin
export const getUser = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {
	
	const user = await User.findById(req.params.id);

	if(!user){
		return next(new ErrorResponse(`Error!`, 404, ['could not find user']))
	}

	const _user = await User.findOne({ _id: user._id}).populate([ 
		{ path: 'roles', select: '_id name'},
		{ path: 'games' },
		{ path: 'game' },
		{ path: 'rooms' },
		{ path: 'chats' }
	 ]);

	res.status(200).json({
		error: false,
		errors: [],
		message: `successful`,
		data: user.isSuper ? null : _user,
		status: 200
	});

})

// @desc    Get a user
// @route   GET /api/v1/users/:id
// @access  Private/Superadmin/Admin
export const getChat = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {
	
	let chat: any;
	
	const { party } = req.body;

	if(!party){
		return next(new ErrorResponse(`Error!`, 400, ['chat party is required']))
	}

	const user = await User.findOne({ _id: req.params.id })

	if(!user){
		return next(new ErrorResponse(`Error!`, 400, ['user does not exist']))
	}

	const chatParty = await User.findOne({ _id: party })

	if(!chatParty){
		return next(new ErrorResponse(`Error!`, 400, ['chat party does not exist']))
	}

	chat = await Chat.findOne({ partyA: user._id, partyB: chatParty._id }).populate([
		{ path: 'messages' }
	]);

	if(!chat){

		chat = await Chat.findOne({ partyA: chatParty._id, partyB: user._id }).populate([
			{ path: 'messages' }
		]);

	}

	res.status(200).json({
		error: false,
		errors: [],
		data: chat,
		message: `successful`,
		status: 200
	});

})

// @desc    Get a user
// @route   GET /api/v1/users/players
// @access  Private/Superadmin/Admin
export const getAllPlayers = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {
	
	const users = await User.find({ isActive: true, userType: 'player' }).select("_id username socketId");

	res.status(200).json({
		error: false,
		errors: [],
		data: users && users.length > 0 ? users : [],
		message: `successful`,
		status: 200
	});

})


// @desc        Change password
// @route       PUT /api/identity/v1/users/change-password/:id
// @access      Private
export const changePassword = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

	const { oldPassword, newPassword, code } = req.body;

	// validate email and password
	if(!oldPassword || !oldPassword){
		return next(new ErrorResponse('invalid', 400, ['old password is required', 'new password is required']));
	}

	// check for user
	const user = await User.findById(req.params.id).select('+password');

	if(!user){
		return next(new ErrorResponse('Error', 400, ['invalid credentials']))
	}

	const isMatched = await user.matchPassword(oldPassword);

	if(!isMatched){
		return next(new ErrorResponse('Error', 400, ['invalid credentials']))
	}

	if(!code && !user.isSuper){

		const mailCode = await generate(6, false);

		let emailData = {
			template: 'email-verify',
			email: user.email,
			preheaderText: 'Verify your email',
			emailTitle: 'Email Verification',
			emailSalute: 'Hi Champ',
			bodyOne: 'Please verify your email using the code below',
			bodyTwo: `${mailCode}`,
			fromName: process.env.FROM_NAME
		}

		await sendGrid(emailData);

		user.emailCode = mailCode.toString();
		user.emailCodeExpire = Date.now() + 30 * 60 * 1000; // 30 minutes // generates timestamp
		await user.save();

		res.status(206).json({
			error: true,
			errors: ['email verification is required'],
			data: null,
			message: 'verification required',
			status: 206
		})
	}

	if(code && !user.isSuper){

		const today = dayjs();

		const codeMatched = await User.findOne({ emailCode: code, emailCodeExpire: { $gt: today }})

		if(!codeMatched){
			return next(new ErrorResponse('invalid code', 400, ['invalid verification code']))
		}

		user.password = newPassword;
		user.savedPassword = newPassword;
		await user.save();

		res.status(200).json({
			error: false,
			errors: [],
			data: null,
			message: 'successfull',
			status: 200
		})

	}

})


// @desc        Add Business manager
// @route       POST /api/identity/v1/users/add-user
// @access      Private
export const addUser = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

	const { firstName, lastName, email, phoneNumber, phoneCode, callback} = req.body;
	const { invite } = req.query;

	if(invite && invite.toString() === 'true' && !callback){
		return next(new ErrorResponse('Error', 400, ['invite callback url is required']));
	}

	// validate
	if(!firstName){
		return next(new ErrorResponse('Error', 400, ['first name is required']));
	}

	if(!lastName){
		return next(new ErrorResponse('Error', 400, ['last name is required']));
	}

	if(!email){
		return next(new ErrorResponse('Error', 400, ['email is required']));
	}

	const existing = await User.findOne({email: email});

	if(existing){
		return next(new ErrorResponse('Error', 403, ['email already exists']));
	}

	if(!phoneNumber){
		return next(new ErrorResponse('Error', 400, ['phone number is required']));
	}

	if(!phoneCode){
		return next(new ErrorResponse('Error', 400, ['phone code is required']));
	}

	if(!strIncludesEs6(phoneCode, '+')){
        return next(new ErrorResponse('Error', 400, ['phone code is must include \'+\' sign']));
    }

	// format phone number
	let phoneStr: string;
	if(strIncludesEs6(phoneCode, '-')){
		phoneStr = phoneCode.substring(3);
	}else{
		phoneStr = phoneCode.substring(1);
	}

	const phoneExists = await User.findOne({ phoneNumber: phoneStr + phoneNumber.substring(1) });

	if(phoneExists){
		return next(new ErrorResponse('Error', 400, ['phone number already exists']));
	}

	const role = await Role.findOne({ name: 'user' }); // get the manager role

	if(!role){
		return next(new ErrorResponse('Error', 500, ['role not found. contact support team.']));
	}

	const password = await generate(8, true);  // generate password

	const user = await User.create({

		firstName,
		lastName,
        email,
        password: password,
		passwordType: 'generated',
		phoneCode: phoneStr,
		savedPassword: password,
		phoneNumber: phoneStr + phoneNumber.substring(1),
		userType: 'user',
        isSuper: false,
		isActivated: false,
		isAdmin: false,
		isTalent: false,
		isBusiness: false,
		isManager: true,
		isUser: true,
		isActive: true

	})

	user.roles.push(role?._id);
	const token = user.getInviteToken();
	await user.save({ validateBeforeSave: false });

	const inviteLink = `${callback}/${token}`;

	if(invite && invite.toString() === 'true'){

		let emailData = {
			template: 'welcome',
			email: user.email,
			preheaderText: 'Checkaam Invitation',
			emailTitle: 'Checkaam Invite',
			emailSalute: 'Hello ' + user.firstName + ',',
			bodyOne: 'Checkaam has invited you to join them their platform.',
			bodyTwo: 'You can accept invitation by clicking the button below or ignore this email to decline. Invitation expires in 24 hours',
			buttonUrl: `${inviteLink}`,
			buttonText: 'Accept Invite',
			fromName: process.env.FROM_NAME
		}

		await sendGrid(emailData);
	}

	const returnData = {
		_id: user._id,
		firstName: user.firstName,
		lastName: user.lastName,
        email: user.email,
		phoneNumber: user.phoneNumber,
		phoneCode: phoneCode,
		role: {
			_id: role?._id,
			name: role?.name
		},
		inviteLink: `${callback}/${token}`,
		userType: user.userType
	}

	res.status(200).json({
		error: false,
		errors: [],
		data: returnData,
		message: 'successful',
		status: 200
	})

})

// @desc        Accept Invite
// @route       PUT /api/identity/v1/users/accept-invite
// @access      Private
export const acceptInvite = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {
	
	const { token } = req.body;

	if(!token){
		return new ErrorResponse('Error', 400, ['token is required'])
	}

	const hashed = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

	const today = dayjs();

	const user = await User.findOne({ inviteToken: hashed, inviteTokenExpire: { $gt: today }});

	if(!user){
		return next(new ErrorResponse('invalid token', 400, ['invite link expired']));
	}

	user.inviteToken = undefined;
	user.inviteTokenExpire = undefined;
	await user.save();
	
	res.status(200).json({
		error: false,
		errors: [],
		data: { _id: user._id, email: user.email, userType: user.userType },
		message: 'successful',
		status: 200
	})

})


export const seedDB = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {
	
	await seedData();
	
	res.status(200).json({
		error: false,
		errors: [],
		data: null,
		message: 'successful',
		status: 200
	})

})

/** 
 * snippet
 * **/

// @desc        Login user (with verification)
// @route       POST /api/identity/v1/auth/login
// @access      Public
// export const funcd = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

// })