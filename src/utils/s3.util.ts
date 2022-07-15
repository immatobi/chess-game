import fs from 'fs';
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

export const uploadImageFile = async (options: any): Promise<object> => {

    const { file, filename, mimeType } = options;

    const theFile = fs.readFileSync(file);

    const bucketData = {
        Bucket: process.env.AWS_BUCKET_NAME || '',
        Key: filename,
        Body: theFile,
        ContentType: mimeType
    }

    const a = await s3.upload(bucketData).promise();
    const resp = {
        url: a.Location,
        data: a
    }

    return resp;

}

export const uploadBase64ImageFile = async (options: any): Promise<object> => {

    const { file, filename, mimeType } = options;

    const buff = Buffer.from(file.replace(/^data:image\/\w+;base64,/, ""),'base64')

    const bucketData = {
		Bucket: process.env.AWS_BUCKET_NAME || '',
		Key: filename,
		Body: buff,
        ContentEncoding: 'base64',
        ContentType: mimeType
	}

    const a = await s3.upload(bucketData).promise();
    const resp = {
        url: a.Location,
    }

    return resp;

}