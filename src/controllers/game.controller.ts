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
import Chat from '../models/Chat.model';


// @desc           Get all users
// @route          GET /api/v1/users
// @access         Private
export const getGames = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {
	res.status(200).json(res.advancedResults);   
})


// @desc    Get a user
// @route   GET /api/v1/users/:id
// @access  Private/Superadmin/Admin
export const getGame = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {
	
	const game = await Game.findOne({ _id: req.params.id }).populate([
		{ path: 'manager' },
		{ path: 'owner' },
		{ path: 'room', select: '_id roomID' },
		{ path: 'members', select: '_id username' },
		{ path: 'playerA', select: '_id username' },
		{ path: 'playerB', select: '_id username' },
		{ path: 'chat', populate: [
			{ path: 'messages' }
		] }
	])

	if(!game){
		return next(new ErrorResponse(`Error!`, 404, ['game does not exist']))
	}

	res.status(200).json({
		error: false,
		errors: [],
		data: game,
		message: `successful`,
		status: 200
	});

})

// @desc    Get a user
// @route   GET /api/v1/users/:id
// @access  Private/Superadmin/Admin
export const getChat = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {
	
	const game = await Game.findOne({ _id: req.params.id });

	if(!game){
		return next(new ErrorResponse(`Error!`, 404, ['game does not exist']))
	}

	const chat = await Chat.findOne({ game: game._id }).populate([ { path: 'messages' } ])

	res.status(200).json({
		error: false,
		errors: [],
		data: chat,
		message: `successful`,
		status: 200
	});

})


// @desc        Login user (with verification)
// @route       POST /api/identity/v1/auth/login
// @access      Public
export const addGame = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

	const { name, description, managerId, roomId } = req.body;

	if(!name){
		return next(new ErrorResponse('Error', 400, ['room name is required']))
	}

	if(!managerId){
		return next(new ErrorResponse('Error', 400, ['manager id is required']))
	}

	if(!roomId){
		return next(new ErrorResponse('Error', 400, ['room id is required']))
	}

	const manager = await User.findOne({ _id: managerId });

	if(!manager){
		return next(new ErrorResponse('Error', 404, ['manager does not exist']))
	}

	if(!manager.hasRole('manager', manager.roles)){
		return next(new ErrorResponse('Error', 404, ['user is not a manager']))
	}

	const room = await Room.findOne({ _id: roomId });

	if(!room){
		return next(new ErrorResponse('Error', 404, ['room does not exist']))
	}

	if(room.games.length === room.gameLimit){
		return next(new ErrorResponse('Error', 403, ['games limit exceeded']))
	}

	const owner = await User.findOne({ _id: req.user._id });

	const gen = generate(6, false);

	const game = await Game.create({
		name, 
		description,
		manager: manager._id,
		roomID: gen.toString(),
		owner: owner?._id,
		room: room._id
	});

	manager.games.push(game._id);
	await manager.save();

	owner?.games.push(game._id);
	await owner?.save();

	room.games.push(game._id);
	await room.save();

	res.status(200).json({
		error: false,
		errors: [],
		data: game,
		message: `successful`,
		status: 200
	});

})

// @desc        Login user (with verification)
// @route       POST /api/identity/v1/auth/login
// @access      Public
export const playGame = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {

	const { userId } = req.body;

	if(!userId){
		return next(new ErrorResponse('Error', 400, ['user id is required']))
	}

	const game = await Game.findOne({ _id: req.params.id });

	if(!game){
		return next(new ErrorResponse('Error', 404, ['game does not exist']))
	}

	const user = await User.findOne({ _id: userId });

	if(!user){
		return next(new ErrorResponse('Error', 404, ['user does not exist']))
	}

	if(game.playersCount === 2){
		return next(new ErrorResponse('Error', 404, ['game players already set']))
	}

	if(!game.playerA && !game.playerB){
		game.playerA = user._id;
		game.playersCount = 1;
		await game.save()
	}

	if(!game.playerA && game.playerB){
		game.playerA = user._id;
		game.playersCount = 2;
		await game.save()
	}

	if(game.playerA && !game.playerB){
		game.playerB = user._id;
		game.playersCount = 2;
		await game.save()
	}

	const _game = await Game.findOne({ _id: game._id }).populate([ 
		{  path: 'playerA', select: '_id username' },
		{  path: 'playerB', select: '_id username' }
	])

	res.status(200).json({
		error: false,
		errors: [],
		data: { playerA: _game?.playerA, playerB: _game?.playerB },
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