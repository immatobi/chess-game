import { ObjectId } from 'mongoose'
import Announcement from '../models/Announcement.model'
import { IResult } from '../utils/types.util'

class AnnService {

    public result: IResult;

    constructor () {
        this.result = { error: false, message: '', data: null }
    }

    public async generateAnnPosition (id: ObjectId): Promise<void> {

        const ann = await Announcement.findOne({ _id: id });
        const announcements = await Announcement.find({});
    
        if(announcements && ann){
    
            if(announcements.length > 1){
    
                const lastAnn = announcements[announcements.length - 2];
                const lastPos = lastAnn.position ? lastAnn.position : 0;
                ann.position = lastPos + 1;
                await ann.save()
    
            }else{
        
                ann.position = 0;
                await ann.save();
        
            }
    
        }
    
    
    }

}

export default new AnnService()
