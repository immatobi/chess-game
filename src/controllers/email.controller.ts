import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import ErrorResponse from '../utils/error.util';
import { asyncHandler } from '@btffamily/checkaam';
import { sendGrid } from '../utils/email.util';

import User from '../models/User.model';
import { generate } from '../utils/random.util'

import dayjs from 'dayjs'
import customparse from 'dayjs/plugin/customParseFormat';
dayjs.extend(customparse)


// @desc    send welcome email to user
// @route   POST /api/identity/v1/emails/welcome/:id
// @access  Private
export const sendWelcomeEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const { email, callbackUrl } = req.body;

    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorResponse('Error', 404, ['user does not exist']));
    }

    if(!email){
        return next(new ErrorResponse('Error', 400, ['email is required']));
    }

    if(!callbackUrl){
        return next(new ErrorResponse('Error', 400, ['callbackUrl is required']));
    }

    if(user.email !== email){
        return next(new ErrorResponse('Error', 400, ['email does not belong to user']));
    }

    try {

        let emailData = {
            template: 'welcome',
            email: email,
            preheaderText: 'welcome',
            emailTitle: 'Welcome to MYRIOI',
            emailSalute: `Hello, ${user.firstName}`,
            bodyOne: 'Welcome to MYRIOI, we\'re glad you joined us.',
            buttonUrl: `${callbackUrl}`,
            buttonText: 'Login To Dashboard',
            fromName: process.env.FROM_NAME
        }

        await sendGrid(emailData);

        res.status(200).json({
            error: false,
            errors: [],
            data: null,
            message: 'successful',
            status: 200
        })
        
    } catch (err) {

        return next(new ErrorResponse('Error', 500, [`There was an error ${err}. Contact support`]))
        
    }

})


// @desc    send activation email
// @route   POST /api/identity/v1/emails/activate/:id
// @access  Private
export const sendActivationEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const { email, callbackUrl } = req.body;

    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorResponse('Error', 404, ['user does not exist']));
    }

    if(!callbackUrl){
        return next(new ErrorResponse('Error', 400, ['callbackUrl is required']));
    }

    if(!email){
        return next(new ErrorResponse('Error', 400, ['email is required']));
    }
    
    if(user.email !== email){
        return next(new ErrorResponse('Error', 400, ['email does not belong to user']));
    }

    // generate activation token
    const activationToken = user.getActivationToken();
    await user.save({ validateBeforeSave: false });

    // generate activation url
    const activationUrl = `${callbackUrl}/${activationToken}`;

    let emailData = {
        template: 'welcome',
        email: email,
        preheaderText: 'activate',
        emailTitle: 'Verify your account',
        emailSalute: `Hello, ${user.firstName}`,
        bodyOne: 'Please confirm that you own this email by clicking the button below',
        buttonUrl: `${activationUrl}`,
        buttonText: 'Login To Dashboard',
        fromName: process.env.FROM_NAME
    }

    await sendGrid(emailData);

    user.isActivated = false;
    user.activationToken = activationToken;
    user.activationTokenExpire = (Date.now() + 5 * 60 * 1000 as unknown) as Date;
    await user.save();

    res.status(200).json({
        error: false,
        errors: [],
        data: null,
        message: 'successful',
        status: 200
    });


})

// @desc    send forgot password email
// @route   POST /api/identity/v1/emails/forgot-password
// @access  Public
export const sendResetLink = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const { email, callbackUrl } = req.body;

    if(!email && !callbackUrl){
        return next(new ErrorResponse('Error', 400, ['email is required', 'callbackUrl is required']));
    }

    if(!email){
        return next(new ErrorResponse('Error', 400, ['email is required']));
    }

    if(!callbackUrl){
        return next(new ErrorResponse('Error', 400, ['callbackUrl is required']));
    }

    const user = await User.findOne({email: email });

    if(!user){
        return next(new ErrorResponse('Error', 404, ['email does not exist']));
    }


    // generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // generate activation url
    const resetUrl = `${callbackUrl}/${resetToken}`;

    let emailData = {
        template: 'welcome',
        email: email,
        preheaderText: 'reset password',
        emailTitle: 'Reset your password',
        emailSalute: `Hello, ${user.firstName}`,
        bodyOne: 'You are receiving this email because you (or someone else) has requested a password reset. Click the button below to change your password or ignore this email if this wasnt you',
        buttonUrl: `${resetUrl}`,
        buttonText: 'Reset Password',
        fromName: process.env.FROM_NAME
    }

    await sendGrid(emailData);

    res.status(200).json({
        error: false,
        errors: [],
        data: null,
        message: 'successful',
        status: 200
    });


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
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save();

	res.status(200).json({
        error: false,
        errors: [],
        data: null,
        message: 'successful',
        status: 200
    })

	// send password changed email
	let emailData = {
		template: 'welcome-business',
		email: user.email,
		preheaderText: 'password changed',
		emailTitle: 'Changed Password',
		emailSalute: `Hello ${user.firstName},`,
		bodyOne:'You have successfully changed your password',
		fromName: process.env.FROM_NAME
	};

	await sendGrid(emailData);

})

// @desc    send email verification code
// @route   POST /api/identity/v1/emails/send-email-code
// @access  Public
export const sendVerificationEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const { email } = req.body;

    if(!email){
        return next( new ErrorResponse('Error', 400, ['email is required']))
    }

    const user = await User.findOne({email: email});

    if(!user){
        return next( new ErrorResponse('Error', 404, ['email does not exist']))
    }

    const mailCode = await generate(6, false);

    let emailData = {
        template: 'email-verify',
        email: email,
        preheaderText: 'verify email',
        emailTitle: 'Email verification',
        emailSalute: `Hello, ${user.firstName}`,
        bodyOne: 'Use the code below to verify your email',
        bodyTwo: `${mailCode}`,
        fromName: process.env.FROM_NAME
    }
    await sendGrid(emailData);

    user.emailCode = mailCode.toString();
    user.emailCodeExpire = Date.now() + 30 * 60 * 1000; // 30 minutes // generates timestamp
    await user.save();

    res.status(200).json({
        error: false,
        errors: [],
        data: null,
        message: 'successful',
        status: 200
    })


})

// @desc    send Invite Link
// @route   POST /api/identity/v1/emails/send-invite
// @access  Public
export const sendInvite = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const { email, callback } = req.body;

    if(!callback){
		return next(new ErrorResponse('Error', 400, ['invite callback url is required']));
	}

    if(!email){
        return next( new ErrorResponse('Error', 400, ['email is required']))
    }

    const user = await User.findOne({email: email});

    if(!user){
        return next( new ErrorResponse('Error', 404, ['email does not exist']))
    }


    const token = user.getInviteToken();
	await user.save({ validateBeforeSave: false });
	const inviteLink = `${callback}/${token}`;

	let emailData = {
        template: 'welcome',
        email: user.email,
        preheaderText: 'XpressChain Invitation',
        emailTitle: 'XpressChain Invite',
        emailSalute: 'Hello ' + user.firstName + ',',
        bodyOne: 'XpressChain has invited you to join them their platform.',
        bodyTwo: 'You can accept invitation by clicking the button below or ignore this email to decline. Invitation expires in 24 hours',
        buttonUrl: `${inviteLink}`,
        buttonText: 'Accept Invite',
        fromName: process.env.FROM_NAME
    }

    await sendGrid(emailData);

    res.status(200).json({
        error: false,
        errors: [],
        data: null,
        message: 'successful',
        status: 200
    })
})