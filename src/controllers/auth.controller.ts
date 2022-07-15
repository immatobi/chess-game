import crypto from 'crypto';
import mongoose, { ObjectId, Model } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import ErrorResponse from '../utils/error.util';
import { sendGrid } from '../utils/email.util';
import { asyncHandler, strIncludesEs6, strToArrayEs6, isString } from '@btffamily/checkaam'
import { generate } from '../utils/random.util';
import { userLogger } from '../config/wiston.config';
import AuthService from '../services/auth.sv';
import UserService from '../services/user.sv';

import dayjs from 'dayjs'
import customparse from 'dayjs/plugin/customParseFormat';
dayjs.extend(customparse);

// models
import User from '../models/User.model'
import Role from '../models/Role.model'

// nats 
import nats from '../events/nats';
import UserCreated from '../events/publishers/user-created';
import Verification from '../models/Verification.model';


declare global {
    namespace Express{
        interface Request{
            user?: any;
        }
    }
}


// @desc    Register User
// @route   POST /api/identity/v1/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const { username, email, password, phoneNumber, phoneCode, callback, userType } = req.body;

    // find the user role
    const role = await Role.findOne({ name: 'user' });

    if(!role){
        return next(new ErrorResponse('An error occured. Please contact support.', 500, ['Roles not defined']));
    }

    // validate existing email
    const exist = await User.findOne({ email: email });

    if(exist){
        return next(new ErrorResponse('Error', 400, ['email already exist, use another email']));
    }

	const _existUname = await User.findOne({ username: username });

    if(_existUname){
        return next(new ErrorResponse('Error', 400, ['username already exist, use another username']));
    }

    // validate phone code
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

	// match user password with regex
	const match =  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/;
	const matched: boolean = match.test(password);

	if(!matched){
		return next(new ErrorResponse('Error', 400, ['password must contain at least 8 characters, 1 lowercase letter, 1 uppercase letter, 1 special character and 1 number']))
	}

    // create the user
    const user = await User.create({
        username,
		email,
        password,
		passwordType: 'self',
		savedPassword: password,
		phoneNumber: phoneStr + phoneNumber.substring(1),
		phoneCode: phoneStr,
		userType: userType,
        isSuper: false,
		isActivated: false,
		isAdmin: false,
		isUser: true,
		isActive: true
    });

	// create verification
	const verification = await Verification.create({

		basic: 'pending',
		ID: 'pending',
		address: 'pending',
		face: 'pending',
		sms: false,
		email: false,
		user: user._id

	})

	user.roles.push(role._id);
	user.verification = verification._id;
	await user.save();

	if(userType === 'player'){
		const role = await Role.findOne({ name: 'player' });
		user.roles.push(role?._id);
		await user.save();
	}

	if(userType === 'manager'){
		const role = await Role.findOne({ name: 'manager' });
		user.roles.push(role?._id);
		await user.save();
	}

    // send emails, publish nats and initialize notification
    if(user){

        try {

            // send welcome email data
            let emailData = {
                template: 'welcome',
                email: email,
                preheaderText: 'welcome',
                emailTitle: 'Welcome to Checkaam',
                emailSalute: `Hello ${user.firstName},`,
                bodyOne: `
				We\'re glad you signed up on Checkaam. Please login to your dashboard by clicking the button below.
				`,
                buttonUrl: `${callback}`,
                buttonText: 'Login',
                fromName: process.env.FROM_NAME
            }
			
            await sendGrid(emailData);

            // // send activation email
            const activateToken = user.getActivationToken();
            await user.save({ validateBeforeSave: false });

            const activateUrl = `${callback}/${activateToken}`;

            let activateData = {
                template: 'welcome',
                email: email,
                preheaderText: 'activate account',
                emailTitle: 'Activate your account',
                emailSalute: `Hello ${user.firstName},`,
                bodyOne: 'Activate your Checkaam account. Click the button below to activate your account',
                buttonUrl: `${activateUrl}`,
                buttonText: 'Activate Account',
                fromName: process.env.FROM_NAME
            }
            await sendGrid(activateData);

            // send response to client
            res.status(200).json({
                error: false,
                errors: [],
                data: { 
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    phoneCode: phoneCode,
                    _id: user._id,
                    id: user.id
                },
                message: 'successful',
                status: 200
            })

			// log user activity
			userLogger.info(`New user created`, {
				_id: user._id,
				email: user.email,
				userType: user.userType
			});
            
        } catch (err) {
            return next(new ErrorResponse('Error', 500, [`${err}`]));
        }


    }else{
        return next(new ErrorResponse('Error', 500, ['an error occured. please contact support']));
    }

});


// @desc        Login user 
// @route       POST /api/identity/v1/auth/login
// @access      Public
export const login = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

	const { email, password, code } = req.body;

	// validate email and password
	if(!email && !password){
		return next(new ErrorResponse('invalid', 400, ['email & password is required']));
	}

	// validate email
	if(!email){
		return next(new ErrorResponse('invalid', 400, ['email is required']));
	}

	// validate password
	if(!password){
		return next(new ErrorResponse('invalid', 400, ['password is required']));
	}

	// check for user
	const user = await User.findOne({ email: email }).select('+password +passwordType').populate([{path: 'verification'}]);

	if(!user){
		return next(new ErrorResponse('Error', 403, ['invalid credentials']))
	}

	if(user.isLocked){
		return next(new ErrorResponse('Error!', 403, ['account currently locked for 30 minutes']))
	}

	if(!user.isActive){
		return next(new ErrorResponse('Error!', 403, ['account currently deactivated. please contact support']))
	}

	// check password
	const isMatched = await user.matchPassword(password);

	if(!isMatched){

		// increase login limit
		if(user.loginLimit as number < 3){
			user.loginLimit = user.increaseLoginLimit()
			await user.save();
		}

		// lock user account if not locked
		if(user.loginLimit >= 3 && !user.checkLockedStatus()){
			user.isLocked = true;
			await user.save();

			return next(new ErrorResponse('Forbidden', 403, ['account currently locked for 30 minutes. Contact support']))
		}

		// return locked 
		if((user.loginLimit === 3 || user.loginLimit > 3) && user.checkLockedStatus()){

			// log user activity
			userLogger.info(`User account locked for 30 minutes`, {
				_id: user._id,
				email: user.email
			});

			return next(new ErrorResponse('Forbidden!', 403, ['account currently locked for 30 minutes. Contact support']));
		}

		return next(new ErrorResponse('Invalid credentials', 403, ['invalid credentials']))
	}

	if(!user.isSuper){

		if(!code && !user.verification.email && !user.verification.sms){

			user.emailCode = undefined;
			user.emailCodeExpire = undefined;
			user.loginLimit = 0;
			user.isLocked = false;
			await user.save();

			// save request user object
			req.user = user;
		
			const message = 'successful';
			sendTokenResponse(user, message, 200, res);

		}

		// generate email verification code
		if(!code && user.verification.email){

			// generate otp code
			const gencode = await generate(6, false);
			user.emailCode = gencode.toString();
			user.emailCodeExpire = Date.now() + 30 * 60 * 1000; // 30 minutes // generates timestamp
			await user.save();

			// send welcome email data
			let emailData = {
				template: 'email-verify',
				email: user.email,
				preheaderText: 'welcome',
				emailTitle: 'Email Verification',
				emailSalute: `Hello ${user.firstName},`,
				bodyOne: `
				Please use the code below to verify your email.
				If this is not you, reach out to us at admin@checkaam.com and ignore this email.
				`,
				bodyTwo: gencode,
				fromName: process.env.FROM_NAME
			}
			
			await sendGrid(emailData);

			res.status(206).json({
				error: false,
				errors: ['email verification is required'],
				data: null,
				message: 'successful',
				status: 206
			})

		}

		if(code){

			// check for email verification
			if(user.verification.email){

				const today = Date.now(); // get timestamp from today's date
				const valid = await User.findOne({ email: user.email , emailCode: code.toString(), emailCodeExpire: { $gt: today } })

				if(!valid){
					return next(new ErrorResponse('Error!', 403, ['invalid verification code']))
				}

				user.emailCode = undefined;
				user.emailCodeExpire = undefined;
				await user.save();

			}

			user.loginLimit = 0;
			user.isLocked = false;
			await user.save();
		
			// save request user object
			req.user = user;

			// log user activity
			userLogger.info(`User logged in [admin]`, {
				_id: user._id,
				email: user.email
			});
		
			const message = 'successful';
			sendTokenResponse(user, message, 200, res);

		}

	}

	if(user.isSuper){

		user.loginLimit = 0;
		user.isLocked = false;
		await user.save();
	
		// save request user object
		req.user = user;

		// log user activity
		userLogger.info(`User logged in [admin]`, {
			_id: user._id,
			email: user.email
		});
	
		const message = 'successful';
		sendTokenResponse(user, message, 200, res);

	}

})

// @desc        Force change password 
// @route       POST /api/identity/v1/auth/force-password
// @access      Public
export const forcePassword = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

    const { email, password } = req.body;

	/// check
	if(!password && !email){
		return next(new ErrorResponse('Error!', 404, ['password is required', 'email is required']));
	}

	if(!password){
		return next(new ErrorResponse('Error!', 404, ['password is required']));
	}

	if(!email){
		return next(new ErrorResponse('Error!', 404, ['email is required']));
	}

	const user = await User.findOne({ email: email });

	if(!user){
		return next(new ErrorResponse('Error', 404, ['user does not exist']));
	}

	if(user.passwordType !== 'generated'){
		return next(new ErrorResponse('Error', 403, ['password is self generated or self-changed']));
	}

	// match user password with regex
	const match =  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/;
	const matched: boolean = match.test(password);

	if(!matched){
		return next(new ErrorResponse('Error', 400, ['password must contain at least 8 characters, 1 lowercase letter, 1 uppercase letter, 1 special character and 1 number']))
	}

	user.password = password;
    user.passwordType = 'self-changed';
	user.savedPassword = password;
    await user.save();

	res.status(200).json({
        error: false,
        errors: [],
        data: { email: user.email, userType: user.userType },
        message: 'successful',
        status: 200
    })

	//TODO: send password changed email

})

// @desc        Logout user
// @route       POST /api/identity/v1/auth/logout
// @access      Public
export const logout = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

	res.cookie('token', 'none', {
		expires: new Date(Date.now() + 10 + 1000),
		httpOnly: true
	});

	res.status(200).json({
		error: false,
		errors: [],
		data: null,
		message: 'Logout successful',
		status: 200,
	});

})

// @desc        Get logged in user
// @route       POST /api/identity/v1/auth/user/:id
// @access      Private
export const getUser = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

	const user = await User.findOne({ _id: req.params.id });

	if(!user){
		return next(new ErrorResponse('Cannot find user', 404, [`Cannot find user`]));
	}

	const _user = await User.findOne({ _id: user._id}).populate([ 
		{ path: 'roles', select: '_id name', },
		{ path: 'verification' },
		{ path: 'kyc' },
		{ path: 'country' },
	 ]);

	res.status(200).json({
		error: false,
		errors: [],
		data: _user,
		message: 'success',
		status: 200,
	});

})

// @desc        change user password (with verification)
// @route       POST /api/identity/v1/auth/change-password/:id
// @access      Private
export const updatePassword = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

	const { oldPassword, newPassword, code } = req.body;

	// validate email and password
	if(!oldPassword || !oldPassword){
		return next(new ErrorResponse('Error', 400, ['old password is required']));
	}

	if(!newPassword){
		return next(new ErrorResponse('Error', 400, ['new password is required']));
	}

	// check for user
	const user = await User.findOne({ _id: req.params.id }).select('+password');

	if(!user){
		return next(new ErrorResponse('Error', 400, ['invalid credentials']))
	}

	const isMatched = await user.matchPassword(oldPassword);

	if(!isMatched){
		return next(new ErrorResponse('Error', 400, ['invalid credentials']))
	}

	const verification = await Verification.findOne({ _id: user.verification });

	if(!verification){
		return next(new ErrorResponse('Error', 500, ['kyc verification is required']))
	}

	if(verification.basic === 'pending'){
		return next(new ErrorResponse('Error', 500, ['kyc basic verification is required']))
	}

	if(!code && !user.isSuper){

		const mailCode = await generate(6, false);

		let emailData = {
			template: 'email-verify',
			email: user.email,
			preheaderText: 'Verify your email',
			emailTitle: 'Email Verification',
			emailSalute: 'Hi ' + user.firstName,
			bodyOne: 'Please verify your email using the code below',
			bodyTwo: `${mailCode}`,
			fromName: process.env.FROM_NAME
		}

		await sendGrid(emailData);

		user.emailCode = mailCode.toString();
		user.emailCodeExpire = Date.now() + 30 * 60 * 1000 // 30 minutes
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

		const today = Date.now()
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

});

// @desc        Send reset password link
// @route       POST /api/identity/v1/auth/forgot-password
// @access      Public
export const sendResetLink = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

	const { email, callback } = req.body;

	if(!email && !callback){
		return next(new ErrorResponse('Error!', 400, ['email is required', 'callback is required']))
	}

	if(!email){
		return next(new ErrorResponse('Error!', 400, ['email is required']))
	}

	if(!callback){
		return next(new ErrorResponse('Error!', 400, ['callback is required']))
	}

	const user = await User.findOne({ email: email})

	if (!user) {
		return next(new ErrorResponse('Error', 404, ['email does not exist']));
	}

	// Get reset token
	const resetToken = user.getResetPasswordToken();
	await user.save({ validateBeforeSave: false });

	try {

		const resetUrl = `${callback}/${resetToken}`;

		let emailData = {
			template: 'welcome',
			email: user.email,
			preheaderText: 'change password',
			emailTitle: 'Reset your password',
			emailSalute: `Hello ${user.firstName},`,
			bodyOne:
			'You are receiving this email because you (or someone else) has requested the reset of your password. Click the button below to change your password or ignore this email if this wasn\'t you.',
			buttonUrl: `${resetUrl}`,
			buttonText: 'Change Password',
			fromName: process.env.FROM_NAME
		};

		await sendGrid(emailData);

		res.status(200).json({
			error: false,
			errors: [],
			data: null,
			message: `Sent reset link to ${user.email}`,
			status: 200,
		});
		
	} catch (err) {

		user.resetPasswordToken = undefined;
		user.resetPasswordTokenExpire = undefined;

		await user.save({ validateBeforeSave: false });

		return next(new ErrorResponse('error!', 500, ['could not send email. Please try again']));
		
	}

})

// @desc        Reset user password
// @route       POST /api/identity/v1/auth/reset-password
// @access      Public
export const resetPassword = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

	const token = req.params.token;
    const { password } = req.body;

	if(!password){
        return next(new ErrorResponse('Error', 400, ['new \'password\' is required']))
    }

	const hashed = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

	// const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordTokenExpire: { $gt: new Date() }});
	const user = await User.findOne({ resetPasswordToken: hashed });

	if(!user){
		return next(new ErrorResponse('error', 404, ['invalid token']));
	}

	const nd = dayjs(user.resetPasswordTokenExpire); // expire date
	const td = dayjs(); // today
	const diff = td.get('minutes') - nd.get('minutes');
	
	if(user && diff > 10 ){
		return next(new ErrorResponse('error', 404, ['invalid token']))
	}

	// match user password with regex
	const match =  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/;
	const matched: boolean = match.test(password);

	if(!matched){
		return next(new ErrorResponse('Error', 400, ['password must contain at least 8 characters, 1 lowercase letter, 1 uppercase letter, 1 special character and 1 number']))
	}

	user.password = password;
	user.savedPassword = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save();

	//TODO: send password changed email
	let emailData = {
		template: 'welcome-business',
		email: user.email,
		preheaderText: 'password reset',
		emailTitle: 'Changed Password',
		emailSalute: `Hello ${user.firstName},`,
		bodyOne:'You have successfully changed your password',
		fromName: process.env.FROM_NAME
	};

	await sendGrid(emailData);

	res.status(200).json({
        error: false,
        errors: [],
        data: null,
        message: 'successful',
        status: 200
    })

})

// @desc        Activate account
// @route       POST /api/identity/v1/auth/activate-account/:token
// @access      Public
export const activateAccount = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

	const token = req.params.token;

	const hashed = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

	const today = dayjs();
	const user = await User.findOne({ activationToken: hashed, activationTokenExpire: {$gt: today } });

	if(!user){
        return next(new ErrorResponse('error!', 403, ['invalid reset token']))
    }

	user.isActivated = true;
    user.activationToken = undefined;
    user.activationTokenExpire = undefined;
	await user.save();

	res.status(200).json({
        error: false,
        errors: [],
        data: null,
        message: 'successful',
        status: 200
    })

})

// @desc        Attach role to a user
// @route       POST /api/identity/v1/auth/attach-role/:id
// @access      Private
export const attachRole = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

	// find the roles
	let roleNames: Array<string> = [], roleIds: Array<string | any> = [];

	const { roles } = req.body;

	if (!isString(roles)){
		return next(new ErrorResponse('error', 400, ['expected roles to be a string separated by commas or spaces']));
	}

	const user = await User.findById(req.params.id);

	if (!user) {
		return next(new ErrorResponse('error!', 404, ['user does not exist']));
	}

	// eslint-disable-next-line prettier/prettier
	if (strIncludesEs6(roles, ',')) {
		roleNames = strToArrayEs6(roles, ',');
	} else if (strIncludesEs6(roles, ' ')) {
		roleNames = strToArrayEs6(roles, ' ');
	} else {
		roleNames.push(roles);
	}

	// get the role objects and extract the IDs
	// may need to refactor this using es6
	for (let j = 0; j < roleNames.length; j++) {

		let role = await Role.findOne({ name: roleNames[j] });

		if (!role) {
			return next(new ErrorResponse('Error', 404, ['role does not exist']));
		}

		roleIds.push(role._id);
	}

	// check if user already has one of the role(s) specified.
	for (let m = 0; m < roleNames.length; m++) {

		const has = await user.hasRole(roleNames[m], user.roles);

		if (!has) {
			continue;
		} else {
			return next(new ErrorResponse('Error!', 404, ['user is already attached to one of the role(s) specified']));
		}

	}

	// set the data --- add the new role(s) specified;
	for(let n: number = 0; n < roleIds.length; n++){
		user.roles.push(roleIds[n]);
	}
	await user.save();

	res.status(200).json({
		error: false,
		errors: [],
		data: null,
		message: `successful`,
		status: 200,
	});

})

// @desc        Detach role from a user
// @route       POST /api/identity/v1/auth/detach-role/:id
// @access      Private
export const detachRole = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

	let uRoles: Array<any> = [];
	let flag: boolean = true;

	const { roleName } = req.body;

	if(!roleName || !isString(roleName)){
		return next(new ErrorResponse('error!', 404, ['role is required and expected to be a string']))
	}

	// find the role
	const role = await Role.findOne({  name: roleName });

	if (!role) {
		return next(new ErrorResponse('error', 404, ['role does not exist']));
	}

	const user = await User.findById(req.params.id);

	if (!user) {
		return next(new ErrorResponse('error!', 404, ['user does not exist']));
	}

	// check if user already has one of the role(s) specified.
	for (let m = 0; m < user.roles.length; m++) {

		if (user.roles[m].toString() === role._id.toString()) {

			flag = true;
			uRoles = user.roles.filter((r) => r.toString() !== role._id.toString());
			break;

		} else {

			flag = false;
			continue;

		}
	}

	if(!flag){
        return next(new ErrorResponse('Error', 404, ['user does not have the role specified']))
    }

	// set the data
	user.roles = uRoles;
	await user.save();

	res.status(200).json({
        error: false,
        errors: [],
        data: null,
        message: 'successful',
        status: 200
    })

})

// Helper function: get token from model, create cookie and send response
const sendTokenResponse = async (user: any, message: string, statusCode: number, res: Response): Promise<void> => {

	let result: any;

	// create token
	const token = user.getSignedJwtToken();

	const options = {
		expires: new Date(
			Date.now() + 6 * 30 * 24 * 60 * 60 * 1000
		),
		httpOnly: true,
		secure: false
	};

	// make cookie work for https
	if (process.env.NODE_ENV === 'production') {
		options.secure = true;
	}

	const _user = await User.findOne({ email: user.email }).populate([
		{ path: 'roles', select: '_id name' },
		{ path: 'verification' },
		{ path: 'country' }
	]);

	if(!_user){ return; }

	const userData = {
		_id: _user._id,
		email: _user.email,
		roles: _user.roles,
		phoneNumber: _user.phoneNumber,
		id: _user.id,
		isSuper: _user.isSuper,
		isActivated: _user.isActivated,
		isAdmin: _user.isAdmin,
		isUser: _user.isUser,
		isActive: _user.isActive,
		passwordType: _user.passwordType,
		country: _user.country,
		verification: !user.isSuper ? {
			basic: _user.verification.basic,
			ID: _user.verification.ID,
			address: _user.verification.address,
			face: _user.verification.face,
			sms: _user.verification.sms,
			email: _user.verification.email,
		}: null
	}

	// set user rank cookie
	// set user point cookie
	res.cookie('rank', _user.rank, options);
	res.cookie('points', _user.points, options);

	res.status(statusCode).cookie('token', token, options).json({
		error: false,
		errors: [],
		message: message,
		token: token,
		data: userData,
		status: 200
	});
};

/** 
 * snippet
 * **/

// @desc        Login user (with verification)
// @route       POST /api/identity/v1/auth/login
// @access      Public
// export const funcd = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

// })