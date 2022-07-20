import { Request, Response, NextFunction } from 'express';
import ErrorResponse from '../utils/error.util';
import { asyncHandler, arrayIncludes } from '@btffamily/checkaam'
import { generate } from '../utils/random.util';

import dayjs from 'dayjs';
import customparse from 'dayjs/plugin/customParseFormat';
dayjs.extend(customparse);

// models
import User from '../models/User.model'
import Game from '../models/Game.model'
import Room from '../models/Room.model';
import { advanced } from '../utils/result.util';


// @desc           Get all users
// @route          GET /api/v1/users
// @access         Private
export const getRooms = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {
	res.status(200).json(res.advancedResults);   
})


// @desc    Get a user
// @route   GET /api/v1/users/:id
// @access  Private/Superadmin/Admin
export const getRoom = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {
	
	const room = await Room.findOne({ _id: req.params.id }).populate([
		{ path: 'manager' },
		{ path: 'owner' },
		{ path: 'games' },
		{ path: 'members', select: '_id username' }
	])

	if(!room){
		return next(new ErrorResponse(`Error!`, 404, ['room does not exist']))
	}

	res.status(200).json({
		error: false,
		errors: [],
		data: room,
		message: `successful`,
		status: 200
	});

})

// @desc    Get a user
// @route   GET /api/v1/users/:id
// @access  Private/Superadmin/Admin
export const getGames = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {
	
	const room = await Room.findOne({ _id: req.params.id })

	if(!room){
		return next(new ErrorResponse(`Error!`, 404, ['room does not exist']))
	}

	const pop = [
		{ path: 'manager', select: '_id username' },
		{ path: 'owner', select: '_id username' }
	]

	const result = await advanced(Game, pop, 'name', req, 'room', room._id);

	res.status(200).json({
		error: false,
		errors: [],
		total: result.total,
        pagination: result.pagination,
        data: result.data,
		message: `successful`,
		status: 200
	});

})

// @desc        Login user (with verification)
// @route       POST /api/identity/v1/auth/login
// @access      Public
export const addRoom = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

	const { name, description, managerId } = req.body;

	if(!name){
		return next(new ErrorResponse('Error', 400, ['room name is required']))
	}

	if(!managerId){
		return next(new ErrorResponse('Error', 400, ['manager id is required']))
	}

	const manager = await User.findOne({ _id: managerId });

	if(!manager){
		return next(new ErrorResponse('Error', 404, ['manager does not exist']))
	}

	if(!manager.hasRole('manager', manager.roles)){
		return next(new ErrorResponse('Error', 404, ['user is not a manager']))
	}

	const owner = await User.findOne({ _id: req.user._id });

	const gen = generate(6, false);

	const room = await Room.create({
		name, 
		description,
		manager: manager._id,
		roomID: gen.toString(),
		owner: owner?._id
	});

	manager.rooms.push(room._id);
	await manager.save();

	owner?.rooms.push(room._id);
	await owner?.save();

	res.status(200).json({
		error: false,
		errors: [],
		data: room,
		message: `successful`,
		status: 200
	});

})

// @desc        Login user (with verification)
// @route       POST /api/identity/v1/auth/login
// @access      Public
export const joinRoom = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

	const { userId } = req.body;

	if(!userId){
		return next(new ErrorResponse('Error', 400, ['user id is required']))
	}

	const room = await Room.findOne({ _id: req.params.id });

	if(!room){
		return next(new ErrorResponse('Error', 404, ['room does not exist']))
	}

	const user = await User.findOne({ _id: userId });

	if(!user){
		return next(new ErrorResponse('Error', 404, ['user does not exist']))
	}

	if(!arrayIncludes(room.members, user._id.toString())){

		room.members.push(user._id);
		await room.save();

	}

	const _room = await Room.findOne({ _id: room._id }).populate([ {  path: 'members', select: '_id username' } ])

	res.status(200).json({
		error: false,
		errors: [],
		data: _room?.members,
		message: `successful`,
		status: 200
	});

})

// @desc        Login user (with verification)
// @route       POST /api/identity/v1/auth/login
// @access      Public
export const leaveRoom = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

	const { userId } = req.body;

	if(!userId){
		return next(new ErrorResponse('Error', 400, ['user id is required']))
	}

	const room = await Room.findOne({ _id: req.params.id });

	if(!room){
		return next(new ErrorResponse('Error', 404, ['room does not exist']))
	}

	const user = await User.findOne({ _id: userId });

	if(!user){
		return next(new ErrorResponse('Error', 404, ['user does not exist']))
	}

	if(arrayIncludes(room.members, user._id.toString())){

		const index = room.members.findIndex((u) => u.toString() === user._id.toString())
		room.members.splice(index, 1);
		await room.save();

	}

	const _room = await Room.findOne({ _id: room._id }).populate([ {  path: 'members', select: '_id username' } ])

	res.status(200).json({
		error: false,
		errors: [],
		data: _room?.members,
		message: `successful`,
		status: 200
	});

})



/** 
 * snippet
 * **/

// @desc        Login user (with verification)
// @route       POST /api/identity/v1/auth/login
// @access      Public
// export const funcd = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

// })