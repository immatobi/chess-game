import fs from 'fs'
import colors from 'colors'

import User from '../../models/User.model'

// read in the JSON file
const users = JSON.parse(
    fs.readFileSync(`${__dirname.split('config')[0]}_data/users.json`, 'utf-8')
)

export const seedUsers = async (): Promise<void> => {

    try {

        const u = await User.find({}); 
        if(u && u.length > 0) return;

        const seed = await User.create(users);

        if(seed){
            console.log(colors.green.inverse('Users seeded successfully'))
        }
        
    } catch (err) {

        console.log(colors.red.inverse(`${err}`))
        
    }

}