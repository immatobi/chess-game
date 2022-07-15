import { Stan } from 'node-nats-streaming'
import { Listener, Subjects } from '@btffamily/checkaam';
import QueueGroupName from '../groupName';

import User from '../../models/User.model';


class LocationSavedListener extends Listener {

    subject = Subjects.LocationSaved;
    queueGroupName = QueueGroupName.Resource + `.${process.env.NODE_ENV}`;

    constructor(client: Stan){
        super(client);
    }

    async onMessage(data: any, msg: any){

        const { user, placeId } = data;

    
        // acknowledge NATS message
        msg.ack();

    }


}

export default LocationSavedListener;