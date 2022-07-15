import fs from 'fs'
import colors from 'colors'
import { advanced } from '../../utils/result.util'
import { CacheKeys } from '@btffamily/checkaam'
import { computeKey } from '../../utils/cache.util'
import redis from '../../middleware/redis.mw'

import Role from '../../models/Role.model'

// read in the JSON file
const roles = JSON.parse(
    fs.readFileSync(`${__dirname.split('config')[0]}_data/roles.json`, 'utf-8')
)

export const seedRoles = async (): Promise<void> => {

    try {

        const r = await Role.find({}); 
        if(r && r.length > 0) return;

        const seed = await Role.create(roles);

        if(seed){
            console.log(colors.green.inverse('Roles seeded successfully'))
        }
        
    } catch (err) {

        console.log(colors.red.inverse(`${err}`))
        
    }

}

export const cacheRoles = async (type: string = 'd') : Promise<void> => {


    if(type === 'd'){
        redis.deleteData(CacheKeys.AuthRole);
    }

    if(type === 'i'){

        try {

            const roles = await advanced(Role, [], 'name');
            
            if(roles && roles.data.length > 0){
    
                // expires in 15 days
                // 1 day === 86400 seconds
                await redis.keepData({ 
                    key: computeKey(process.env.NODE_ENV, CacheKeys.AuthRole), 
                    value: { data: roles.data, pagination: roles.pagination }}, 
                    (15 * 86400));
    
            }
            
        } catch (err) {
    
            console.log(colors.red.inverse(`${err}`))
            
        }

    }

    

}