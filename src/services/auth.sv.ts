import { arrayIncludes } from '@btffamily/checkaam';
import { IResult } from '../utils/types.util'

class AuthService {

    public result: IResult;

    constructor () {
        this.result = { error: false, message: '', data: null }
    }

    

}

export default new AuthService()