import ErrorResponse from '../utils/error.util'
import { Request, Response, NextFunction } from 'express'
import { asyncHandler } from '@btffamily/checkaam'

declare global {
    namespace Express{
        interface Request{
            language?: any;
            channel?: any;
        }
    }
}

export const validateChannels = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {


    if(!process.env.APP_CHANNELS){
        return next(new ErrorResponse('There was an error. Please contact support team', 500, ['APP_CHANNELS not defined']));
    }

    const channelStr: string = process.env.APP_CHANNELS || '';

    try {

        if(!req.headers.lg && !req.headers.ch){
            return next(new ErrorResponse('forbidden!', 403, ['no language specified', 'no device-channel specified']));
        }

        if(!req.headers.lg){
            return next(new ErrorResponse('langless', 403, ['no language specified']));
        }

        if(!req.headers.ch){
            return next(new ErrorResponse('security violation', 403, ['no device-channel specified']));
        }

        const ch: string = req.headers.ch.toString();
        const channels: Array<string> = channelStr.split(',');

        if(!channels.includes(ch)){
            return next(new ErrorResponse('security violation', 403, ['device-channel not supported']));
        }

        req.language = req.headers.lg;
        req.channel = req.headers.ch;

        return next();
        
    } catch (err) {

        console.log(err);
        return next(new ErrorResponse('forbidden!', 403, ['security violation!']));
        
    }


})