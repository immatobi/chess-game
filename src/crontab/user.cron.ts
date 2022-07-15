import User from '../models/User.model';
import Worker from './worker'
import nats from '../events/nats';
import UserCreated from '../events/publishers/user-created';
import Role from '../models/Role.model';

import UserService from '../services/user.sv'


export const unlockUserAccounts = async (cron: any | string) => {

    // set a new worker instance
    const cronworker = new Worker();

    // set the cron exoression
    cronworker.expression = cron;
    
    // schedule the job (starts automatically with false as first parameter)
    cronworker.schedule(false, '', async () => {

        // find all users
        const users = await User.find({ isLocked: true });

        if(users.length > 0){

            // unlock the accounts
            for(let i = 0; i < users.length; i++){

                users[i].isLocked = false;
                users[i].loginLimit = 0;
                await users[i].save();

                console.log(`${users[i].email} account unlocked`);

            }

        }
        

    })


}

export const syncAdminDetails = async (cron: any | string) => {

    // set a new worker instance
    const cronworker = new Worker();

    // set the cron exoression
    cronworker.expression = cron;
    
    // schedule the job (starts automatically with false as first parameter)
    cronworker.schedule(false, '', async () => {

        // find all role

        const role = await Role.findOne({ name: 'superadmin' });

        if(role){

            const user = await User.findOne({ email: process.env.SUPERADMIN_EMAIL });
            // publish NATS
            await new UserCreated(nats.client).publish({ user: user, userType: 'admin', phoneCode: '+234' });

            // stop the current task ( this runs the task once )
            cronworker.event.emit('CRON COMPLETED SA');

            // listen for event
            cronworker.event.on('CRON COMPLETED SA', () => {
                console.log('cron done');
                cronworker.task.stop();
            })

        }
        

    })


}

export const syncAllUsers = async (cron: any | string) => {

    // set a new worker instance
    const cronworker = new Worker();

    // set the cron exoression
    cronworker.expression = cron;
    
    // schedule the job (starts automatically with false as first parameter)
    cronworker.schedule(false, '', async () => {

        UserService.publishAllUsers();

        // // stop the current task ( this runs the task once )
        cronworker.event.emit('CRON COMPLETED');

        // // listen for event
        cronworker.event.on('CRON COMPLETED', () => {
            cronworker.task.stop();
        })

    })


}

