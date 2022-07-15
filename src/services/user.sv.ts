import { IResult } from '../utils/types.util'
import { ObjectId } from 'mongoose'
import User from '../models/User.model';
import { sendGrid } from '../utils/email.util';
import Axios from 'axios'

import nats from '../events/nats'
import UserCreated from '../events/publishers/user-created'
import Verification from '../models/Verification.model';

class UserService {

    public result: IResult;

    constructor () {
        this.result = { error: false, message: '', data: null }
    }

    public async sendAccountEmail(id: ObjectId, business: string, callback: string): Promise<IResult>{

        const user = await User.findOne({ _id: id });

        if(user){

            let emailData = {
                template: 'welcome',
                email: user.email,
                preheaderText: 'Checkaam Invitation - Welcome',
                emailTitle: 'Checkaam Invitation - Welcome',
                emailSalute: 'Hello ' + user.firstName ? user.firstName : 'Champ' + ',',
                bodyOne: `
                    A Checkaam account has been created for you ${user.userType === 'customer' && business !== '' ? 'by ' + business : 'based on your order'}.
                    Please, use the login details below to access your dashboard, track your orders and more.
                `,
                bodyTwo: `Email: ${user.email} and Password: ${user.savedPassword}`,
                buttonUrl: `${callback}`,
                buttonText: 'Access Dashboard',
                fromName: process.env.FROM_NAME
            }

            await sendGrid(emailData);

            this.result.error = false;
            this.result.message = 'email sent successfully';

        }

        return this.result;

    }

    public async publishAllUsers(): Promise<void>{

        const users = await User.find({ isActive: true, isLocked: false });

        if(users && users.length > 0){

            for(let i = 0; i < users.length; i++){

                const user = users[i];

                setTimeout(async () => {

                    await new UserCreated(nats.client).publish({ 
                        user: user, 
                        userType: user.userType, 
                        sub: { 
                            plan: user.status.sub.plan, 
                            freq: 'monthly' 
                        },
                        phoneCode: '+' + user.phoneCode,
                        callback: process.env.CHECKAAM_STORE_URL,
                        account: 'all'
                    })

                }, 8000)

            }

        }

    }

    public async createVerificationData(userId: ObjectId, sms: boolean = false, email: boolean = false): Promise<void> {

        const user = await User.findOne({ _id: userId });

        if(user){

            const verif = await Verification.create({

                basic: 'pending',
                ID: 'pending',
                address: 'pending',
                face: 'pending',
                sms: sms,
                email: email,
                user: user._id

            });

            user.verification = verif._id;
            await user.save();

        }

    }

}

export default new UserService();