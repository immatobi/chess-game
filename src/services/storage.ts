import { arrayIncludes, isString } from '@btffamily/checkaam';
import { uploadBase64File } from '../utils/google.util'
import { generate } from '../utils/random.util';
import { IResult } from '../utils/types.util'

class StorageService {

    public result: IResult;

    constructor () {
        this.result = { error: false, message: '', data: null }
    }

    public async uploadGcpFile(data: any, filename: string, type: string = 'base64'): Promise<IResult> {

        const allowed = ['base64', 'filedata'];

        // crash the app if proper type is not set
        if(!arrayIncludes(allowed, type)){
            this.result.error = true;
            this.result.message = 'uplaod data type is invalid';
            this.result.data = null;
        }

        if(type === 'base64'){

            if(!isString(data)){

                this.result.error = true;
                this.result.message = 'data must be a string';
                this.result.data = null;

                return this.result;

            } 
            
            const mime = data.split(';base64')[0].split(':')[1];

            if(!mime || mime === '') {

                this.result.error = true;
                this.result.message = 'data is is expected to be base64 string'
                this.result.data = null;

                return this.result;
            }

            // generate random number
            const gen = generate(8,false);

            // upload file
            const fileData = {
                file: data,
                filename: `${filename}_filename`,
                mimeType: mime
            }

            const gData = await uploadBase64File(fileData);

            this.result.error = false;
            this.result.message = ''
            this.result.data = gData;

        }

        return this.result;

    }

}

export default new StorageService();