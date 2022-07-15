import { Storage } from '@google-cloud/storage'

// const client = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID);
const BUCKET_NAME: string | any = process.env.GOOGLE_BUCKET_NAME || 'concreap-buckets';
const gcKeyPath = `${__dirname.split('utils')[0]}_data/gc-tma-key.json`;

export const uploadBase64File = async (data: object | any): Promise<any> => {

    const { file, filename, mimeType } = data;

    // Creates a client
    const storage = new Storage({
        projectId: 'checkaam',
        keyFilename: gcKeyPath
    });

    // check
    const [bucketExist] = await storage.bucket(BUCKET_NAME).exists();

    // create bucket if it does not exist
    if(!bucketExist){
        await storage.createBucket(BUCKET_NAME);
    }

    /// generate file name
    const newFileName = storage.bucket(BUCKET_NAME).file(filename);

    // create file options
    const fileOpitions: any = {
        public: true,
        resumable: false,
        metadata: { contentType: mimeType },
        validation: false
    }

    const base64Encoded = file.replace(/^data:\w+\/\w+;base64,/, '');
    const fileBuffer = Buffer.from(base64Encoded, 'base64');
    await newFileName.save(fileBuffer, fileOpitions);

    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`;

    const [metadata] = await newFileName.getMetadata();

    return {
        ...metadata,
        publicUrl
    }

    // return null;

    /// sample response

    // kind: 'storage#object',
    // id: 'checkaam-buckets/d-logo/1637817557738581',
    // selfLink: 'https://www.googleapis.com/storage/v1/b/checkaam-buckets/o/d-logo',
    // mediaLink: 'https://storage.googleapis.com/download/storage/v1/b/checkaam-buckets/o/d-logo?generation=1637817557738581&alt=media',
    // name: 'd-logo',
    // bucket: 'checkaam-buckets',
    // generation: '1637817557738581',
    // metageneration: '1',
    // contentType: 'image/jpeg',
    // storageClass: 'STANDARD',
    // size: '108876',
    // md5Hash: 'cufqrkpSwPbqQpgq66Ca4g==',
    // crc32c: 'nw4TEA==',
    // etag: 'CNXI8e3hsvQCEAE=',
    // timeCreated: '2021-11-25T05:19:17.770Z',
    // updated: '2021-11-25T05:19:17.770Z',
    // timeStorageClassUpdated: '2021-11-25T05:19:17.770Z',
    // publicUrl: 'https://storage.googleapis.com/checkaam-buckets/d-logo'

}

export const deleteGcFile = async (name: string): Promise<any> => {

    // Creates a client
    const storage = new Storage({
        projectId: 'checkaam',
        keyFilename: gcKeyPath
    });

    // check
    const [bucketExist] = await storage.bucket(BUCKET_NAME).exists();

    // create bucket if it does not exist
    if(bucketExist){
        const file = await storage.bucket(BUCKET_NAME).file(name);
        if(file){
            await file.delete();
        }
    }

    // return null;

    /// sample response

    // kind: 'storage#object',
    // id: 'checkaam-buckets/d-logo/1637817557738581',
    // selfLink: 'https://www.googleapis.com/storage/v1/b/checkaam-buckets/o/d-logo',
    // mediaLink: 'https://storage.googleapis.com/download/storage/v1/b/checkaam-buckets/o/d-logo?generation=1637817557738581&alt=media',
    // name: 'd-logo',
    // bucket: 'checkaam-buckets',
    // generation: '1637817557738581',
    // metageneration: '1',
    // contentType: 'image/jpeg',
    // storageClass: 'STANDARD',
    // size: '108876',
    // md5Hash: 'cufqrkpSwPbqQpgq66Ca4g==',
    // crc32c: 'nw4TEA==',
    // etag: 'CNXI8e3hsvQCEAE=',
    // timeCreated: '2021-11-25T05:19:17.770Z',
    // updated: '2021-11-25T05:19:17.770Z',
    // timeStorageClassUpdated: '2021-11-25T05:19:17.770Z',
    // publicUrl: 'https://storage.googleapis.com/checkaam-buckets/d-logo'

}