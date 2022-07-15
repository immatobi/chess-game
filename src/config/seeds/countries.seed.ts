import fs from 'fs'
import colors from 'colors'
import { advanced } from '../../utils/result.util'
import { computeKey, CacheKeys } from '../../utils/cache.util'
import redis from '../../middleware/redis.mw'

import Country from '../../models/Country.model'

// read in the JSON file
const countries = JSON.parse(
    fs.readFileSync(`${__dirname.split('config')[0]}_data/countries.json`, 'utf-8')
)

export const seedCountries = async (): Promise<void> => {

    try {

        const r = await Country.find({}); 
        if(r && r.length > 0) return;

        const seed = await Country.create(countries);

        if(seed){
            console.log(colors.green.inverse('Countries seeded successfully'))
        }
        
    } catch (err) {

        console.log(colors.red.inverse(`${err}`))
        
    }

}

export const cacheCountries = async (type: string = 'd') : Promise<void> => {


    if(type === 'd'){
        redis.deleteData(CacheKeys.Countries);
    }

    if(type === 'i'){

        try {

            const countries = await advanced(Country, [], 'name', null, null, null);
            
            if(countries && countries.data.length > 0){
    
                // expires in 15 days
                // 1 day === 86400 seconds
                await redis.keepData({ 
                    key: computeKey(process.env.NODE_ENV, CacheKeys.Countries), 
                    value: { data: countries.data, pagination: countries.pagination }}, 
                    (15 * 86400));
    
            }
            
        } catch (err) {
    
            console.log(colors.red.inverse(`${err}`))
            
        }

    }

    

}