import { ObjectId } from 'mongoose'
import { IResult, IBasicKyc, IAddressKyc } from '../utils/types.util'

class KYCService {

    public result: IResult;

    constructor () {
        this.result = { error: false, message: '', data: null }
    }

    public validateBasicKyc (data: IBasicKyc): IResult{
    
        if(!data.firstName){
            this.result.error = true;
            this.result.message = 'first name is required'
        }
    
        if(!data.lastName){
            this.result.error = true;
            this.result.message = 'last name is required'
        }
    
        if(!data.middleName){
            this.result.error = true;
            this.result.message = 'middle name is required'
        }
    
        if(!data.dob){
            this.result.error = true;
            this.result.message = 'date of birth [dob] is required'
        }
    
        if(!data.gender){
            this.result.error = true;
            this.result.message = 'gender is required'
        }
    
        if(!data.age){
            this.result.error = true;
            this.result.message = 'age is required'
        }
    
        return this.result;
    
    }

    public validateIDKyc = (data: any): IResult => {
    
        if(!data.type){
            this.result.error = true;
            this.result.message = 'id type is required'
        }else if(!data.front){
            this.result.error = true;
            this.result.message = 'id front image is required'
        }else if(data.type !== 'passport' && !data.back){
            this.result.error = true;
            this.result.message = 'id back image is required'
        }
    
        return this.result;
    
    }

    public validateAddressKyc = (data: IAddressKyc): IResult => {
    
        if(!data.country){
            this.result.error = true;
            this.result.message = 'country is required'
        }
    
        if(!data.city){
            this.result.error = true;
            this.result.message = 'city is required'
        }
    
        if(!data.state){
            this.result.error = true;
            this.result.message = 'state is required'
        }
    
        if(!data.address){
            this.result.error = true;
            this.result.message = 'address is required'
        }
    
        if(!data.postalCode){
            this.result.error = true;
            this.result.message = 'postal code is required'
        }
    
        if(!data.utilityDoc){
            this.result.error = true;
            this.result.message = 'utility document is required'
        }
    
        return this.result;
    
    }

}

export default new KYCService();
