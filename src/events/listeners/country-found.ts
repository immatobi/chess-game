import { Stan } from 'node-nats-streaming'
import { Listener, Subjects } from '@btffamily/checkaam';
import QueueGroupName from '../groupName';

import Country from '../../models/Country.model'
import User from '../../models/User.model';


class CountryFoundListener extends Listener {

    subject = Subjects.CountryFound;
    queueGroupName = QueueGroupName.Resource + `.${process.env.NODE_ENV}`;

    constructor(client: Stan){
        super(client);
    }

    async onMessage(data: any, msg: any){

        let cData;
        const { _id, country } = data;

        const user = await User.findOne({ _id: _id });
        cData = await Country.findOne({ name: country.name });

        if(user && !user.country){

            if(!cData){

                await Country.create({

                    name: country.name,
                    code2: country.code2,
                    code3: country.code3,
                    states: country.states,
                    capital: country.capital,
                    region: country.region,
                    subRegion: country.subRegion,
                    flag: country.flag,
                    phoneCode: country.phoneCode,
                    currencyCode: country.currencyCode,
                    currencyImage: country.currencyImage

                })

            }

            user.country = cData?._id;
            await user.save();

        }

        // acknowledge NATS message
        msg.ack();

    }


}

export default CountryFoundListener;