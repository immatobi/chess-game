import crypto from 'crypto';
import mongoose, { ObjectId } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import ErrorResponse from '../utils/error.util';
import { systemLogger } from '../config/wiston.config';
import { asyncHandler, sortData, rearrangeArray } from '@btffamily/checkaam'
import { generate } from '../utils/random.util';
import { uploadBase64File } from '../utils/google.util'
import AnnService from '../services/ann.sv'
import redis from '../middleware/redis.mw'
import { CacheKeys, computeKey} from '../utils/cache.util'

import dayjs from 'dayjs'
import customparse from 'dayjs/plugin/customParseFormat';
dayjs.extend(customparse);

// models
import User from '../models/User.model'
import Announcement from '../models/Announcement.model'

// @desc    Get all Announcements
// @route   GET /api/identity/v1/announcements/
// @access  Private
export const getAnnouncements = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json(res.advancedResults);  
});

// @desc    Get Announcements
// @route   GET /api/identity/v1/announcements/get-announcements
// @access  Private
export const getAllAnnouncements = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    
    const annList = await Announcement.find({ isEnabled: true });

    const sorted = sortData(annList, 'position');

    const data = {
        key: computeKey(process.env.NODE_ENV, CacheKeys.Anns),
        value: { data: sorted }
    }

    redis.keepData(data, parseInt('1800')); //save to cache

    res.status(200).json({
        error: false,
        errors: [],
        data: annList.length > 0 ? sorted : [],
        message: 'successful',
        statusCode: 200
    })

});

// @desc    Get an Announcements
// @route   GET /api/identity/v1/announcements/:id
// @access  Private
export const getAnnouncement = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    
    const ann = await Announcement.findOne({ _id: req.params.id });

    if(!ann){
        return next(new ErrorResponse('Error', 404, ['announcement does not exist']));
    }

    res.status(200).json({
        error: false,
        errors: [],
        data: ann,
        message: 'successful',
        statusCode: 200
    })

});

// @desc    Add an Announcement
// @route   POST /api/identity/v1/announcements
// @access  Private
export const addAnnouncement = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    
    const { title, description, content, thumbnail, enabled } = req.body;

    if(!title){
        return next(new ErrorResponse('Error', 400, ['title is required']))
    }

    if(!description){
        return next(new ErrorResponse('Error', 400, ['title is description']))
    }

    if(!content){
        return next(new ErrorResponse('Error', 400, ['content is description']))
    }

    const existing = await Announcement.findOne({ title: title });

    if(existing){
        return next(new ErrorResponse('Error', 404, ['announcement title already exists']))
    }

    const ann = await Announcement.create({
        title,
        description,
        content,
        isEnabled: enabled && enabled === true ? true : false
    });

    await AnnService.generateAnnPosition(ann._id);

    if(thumbnail){

        const mime = thumbnail.split(';base64')[0].split(':')[1];

        if(!mime || mime === '') {
            return next(new ErrorResponse(`invalid format`, 400, ['thumbnail is expected to be base64 string']));
        }

        const gen = generate(6, false);

        // upload file
        const fileData = {
            file: thumbnail,
            filename: gen.toString() + '_' + 'ann_thumb',
            mimeType: mime
        }

        // upload to google cloud storage
        const gData = await uploadBase64File(fileData);

        ann.thumbnail = gData.publicUrl;
        await ann.save();

    }

    const _anouncement = await Announcement.findOne({ _id: ann._id });
    await redis.deleteData(CacheKeys.Anns);

    systemLogger.info(`New announcement created`, {
        user: req.user._id
    })

    res.status(200).json({
        error: false,
        errors: [],
        data: _anouncement,
        message: 'successful',
        statusCode: 200
    })

});

// @desc    Add an Announcement
// @route   PUT /api/identity/v1/announcements/:id
// @access  Private
export const updateAnnouncement = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    
    const { title, description, content, thumbnail, enabled } = req.body;

    const ann = await Announcement.findOne({ _id: req.params.id });

    if(!ann){
        return next(new ErrorResponse('Error', 404, ['announcement does not exist']))
    }

    const existing = await Announcement.findOne({ title: title });

    if(existing){
        return next(new ErrorResponse('Error', 404, ['announcement title already exists']))
    }

    ann.title = title ? title : ann.title;
    ann.description = description ? description : ann.description;
    ann.content = content ? content : ann.content;
    ann.isEnabled = enabled && enabled === true ? true : ann.isEnabled;
    await ann.save();

    if(thumbnail){

        const mime = thumbnail.split(';base64')[0].split(':')[1];

        if(!mime || mime === '') {
            return next(new ErrorResponse(`invalid format`, 400, ['thumbnail is expected to be base64 string']));
        }

        const gen = generate(6, false);

        // upload file
        const fileData = {
            file: thumbnail,
            filename: gen.toString() + '_' + 'ann_thumb',
            mimeType: mime
        }

        // upload to google cloud storage
        const gData = await uploadBase64File(fileData);

        ann.thumbnail = gData.publicUrl;
        await ann.save();

    }

    await redis.deleteData(CacheKeys.Anns);

    res.status(200).json({
        error: false,
        errors: [],
        data: ann,
        message: 'successful',
        statusCode: 200
    })

});

// @desc    Delete an Announcement
// @route   DELETE /api/identity/v1/announcements/:id
// @access  Private
export const removeAnnouncement = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const ann = await Announcement.findOne({ _id: req.params.id });

    if(!ann){
        return next(new ErrorResponse('Error', 404, ['announcement does not exist']))
    }

    await Announcement.deleteOne({ _id: ann._id });
    await redis.deleteData(CacheKeys.Anns); // delete cache

    res.status(200).json({
        error: false,
        errors: [],
        data: null,
        message: 'successful',
        statusCode: 200
    })

});

// @desc    Move an Announcement
// @route   PUT /api/identity/v1/announcements/move/:id
// @access  Private
export const moveAnnouncement = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    
    const { index } = req.body;

    if (!index) {
        return next(new ErrorResponse('Error', 400, ['index is required']))
    }

    const ann = await Announcement.findOne({ _id: req.params.id });

    if (!ann) {
        return next(new ErrorResponse('Error', 404, ['announcement does not exist']))
    }

    const announcements = await Announcement.find({});

    if (!announcements) {
        return next(new ErrorResponse('Error', 404, ['announcements does not exist in the system']))
    }

    if (announcements.length <= index) {
        return next(new ErrorResponse('Error', 400, ['index value is invalid. cannot move array']))
    }

    const annIndex = announcements.findIndex((a) => a._id === ann._id);
    const arranged = rearrangeArray(annIndex, index, announcements);

    for (let i = 0, j = 0; i < arranged.length, j < announcements.length; i++, j++) {

        if (arranged[i]._id.toString() === announcements[j]._id.toString()) {

        await Announcement.deleteMany();
        await Announcement.create(arranged);

    }
    
    //get new list
    const list = await Announcement.find({});

        res.status(200).json({
            error: false,
            errors: [],
            data: list,
            message: 'successful',
            statusCode: 200
        })

    }
});