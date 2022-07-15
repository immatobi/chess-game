import { Request, Response, NextFunction } from 'express';
import ErrorResponse from '../utils/error.util';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

    let error = { ...err };
	error.message = err.message;

	if(process.env.NODE_ENV === 'development'){
		console.log("the error", err); // log the error to get what to test for
	}

	let ea: any = [];

    // ...
	if(err.errors !== undefined){

		ea = Object.values(err.errors).map((item: any) => {
			let m = '';
			if(item.properties){
				m = item.properties.message;
			}else{
				m = item;
			}
			return m;
		});

	}

    // Mongoose bad objectID
	if (err.name === 'CastError') {
		const message = `Resource not found`;
		error = new ErrorResponse(message, 404, ea);
	}

    // Mongoose duplicate key
	if (err.code === 11000) {
		const message = `Duplicate field value entered`;
		error = new ErrorResponse(message, 400, ea);
	}

	// Mongoose validation error
	if (err.name === 'ValidationError') {
		const message = "An error occured";
		error = new ErrorResponse(message, 400, ea);
	}

    // Mongoose reference error
	if (err.name === 'ReferenceError') {
		const message = "Something is not right";
		error = new ErrorResponse(message, 400, ea);
	}

    res.status(error.statusCode || 500).json({
		error: true,
		errors: error.errors ? error.errors : [],
		data: null,
		message: error.message || `Server Error`,
		status: error.statusCode ? error.statusCode : 500
	});


}

export default errorHandler;