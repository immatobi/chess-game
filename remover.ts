import mongoose from 'mongoose'
import colors from 'colors'
import { config } from 'dotenv'

// env vars //make changes
config();

// models
import Role from './src/models/Role.model'
import Country from './src/models/Country.model'
import Announcement from './src/models/Announcement.model'
import User from './src/models/User.model'
import Kyc from './src/models/Kyc.model'
import Verification from './src/models/Verification.model'

const options: object = {

    useNewUrlParser: true,
    autoIndex: true,
    keepAlive: true,
    maxPoolSize: 10,
    wtimeoutMS:2500,
    connectTimeoutMS: 25000,
    socketTimeoutMS: 45000,
    family: 4,
    useUnifiedTopology: true

}

// connect to db
const connectDB = async(): Promise<void> => {

    if(process.env.NODE_ENV === 'test'){
        mongoose.connect(process.env.MONGODB_TEST_URI || '', options);
    }

    if(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production'){
        mongoose.connect(process.env.MONGODB_URI || '', options);
    }

}

// delete data
const deleteData = async () : Promise<void> => {

    try {

        await connectDB();

        await Role.deleteMany();
        await User.deleteMany();
        await Announcement.deleteMany();
        await Country.deleteMany();
        await Verification.deleteMany();
        await Kyc.deleteMany();

        console.log(colors.red.inverse('data destroyed successfully...'));
        process.exit();
        
    } catch (err) {
        console.log(err);
    }

}

if(process.argv[2] === '-d'){
    deleteData();
}

// export db delete data
export const deleteDBData = async () : Promise<void> => {

    try {

        await connectDB();

        await Role.deleteMany();
        await Role.deleteMany();
        await User.deleteMany();
        await Announcement.deleteMany();
        await Country.deleteMany();
        await Verification.deleteMany();
        await Kyc.deleteMany();

        console.log(colors.red.inverse('data destroyed successfully...'));
        process.exit();
        
    } catch (err) {
        console.log(err);
    }

}
