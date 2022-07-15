import { Model } from 'mongoose';
import { Request } from 'express';
import { sortData } from '@btffamily/checkaam';
import { IPagination } from '../utils/types.util'

const defineRef = (ref: string): string => {
	return ref === 'id' ? '_id' : ref
}

export const advanced = async (model: Model<any>, populate: Array<any> = [], sortRef: string = '', req: any = {}, ref: any = null, value: any = null): Promise<IPagination> => {

	let query: any;

	// copy request query
	const reqQuery = { ...req.query };

	// fields to exclude
	const removeFields = ['select', 'sort', 'page', 'limit'];

	// loop over removeFields and delete them from request query
	removeFields.forEach((p) => delete reqQuery[p]);

	// create query string
	let queryStr = JSON.stringify(reqQuery);

	// create operators
	queryStr = queryStr.replace(
		/\b(gt|gte|lt|lte|in)\b/g,
		(match) => `$${match}`
	);

	// find resource
	if(ref === null && value === null){
		query = model.find(JSON.parse(queryStr));
	}else{
		query = model.find({}).where(defineRef(ref)).equals(value);
	}

	// select fields
	if (req.query && req.query.select) {
		const fields = (req.query.select as string).split(',').join(' ');
		query = query.select(fields);
	}

	// sort
	if (req.query && req.query.sort) {
		const sortBy = (req.query.sort as string).split(',').join(' ');
		query = query.sort(sortBy);
	} else {
		query = query.sort('-createdAt');
	}

	// pagination
	const page = parseInt((req.query && req.query.page as string), 10) || 1;
	const limit = parseInt((req.query && req.query.limit as string), 10) || 50;
	const startIndex = (page - 1) * limit;
	const endIndex = page * limit;
	const total = await model.countDocuments();

	query = query.skip(startIndex).limit(limit);

	//populate
	if (populate) {
		query = query.populate(populate);
	}

	// execute query
	const results: any = await query;

	// Pagination result
	const pagination: any = {};

	if (endIndex < total) {
		pagination.next = {
			page: page + 1,
			limit,
		};
	}

	if (startIndex > 0) {
		pagination.prev = {
			page: page - 1,
			limit,
		};
	}

	const sorted = sortData(results, sortRef !== '' ? sortRef : 'createdAt');

	const returnData: IPagination = {
		total: results.length,
		pagination: pagination,
		data: sorted
	}

	return returnData

}
