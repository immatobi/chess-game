import { arrayIncludes } from '@btffamily/checkaam';
import { Part } from 'aws-sdk/clients/s3'
import { IResult } from '../utils/types.util'

class AuthService {

    public result: IResult;

    constructor () {
        this.result = { error: false, message: '', data: null }
    }

    

}

export default new AuthService()