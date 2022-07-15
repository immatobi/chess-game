import { Request } from 'express'
import Role from '../../models/Role.model'
import User from '../../models/User.model'
import colors from 'colors';

import { seedRoles, cacheRoles } from './role.seed'
import { seedUsers } from './user.seed'
import { seedCountries, cacheCountries } from './countries.seed'


// role functions
const attachSuperRole = async (): Promise<void> => {

    const superadmin = await User.findOne({ email: process.env.SUPERADMIN_EMAIL });
    const role = await Role.findOne({ name: 'superadmin' });


    if(superadmin && role){

        const _hasrole = await superadmin.hasRole('superadmin', superadmin.roles);

        if(!_hasrole){

            superadmin.roles.push(role._id);
            await superadmin.save();

            console.log(colors.magenta.inverse('Superadmin role attached successfully'));

        }

    }

}

export const seedData = async (): Promise<void> => {

    await seedRoles();
    await cacheRoles('d');
    await seedUsers();
    await seedCountries()
    await cacheCountries('d');

    // attach superadmin role
    await attachSuperRole();

}
