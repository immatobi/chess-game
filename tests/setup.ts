import { seedData } from '../src/config/seeds/seeder.seed'
import mongoose from 'mongoose'
import redis from '../src/middleware/redis.mw'
import colors from 'colors';
import { config } from 'dotenv'
import { deleteDBData } from '../remover'


// variables
var dbConn: any;

// timeout
jest.setTimeout(1000000);

const connectRedis = async (): Promise<void> => {

    const PORT = process.env.REDIS_PORT || '6379';
    const HOST = process.env.REDIS_HOST || '127.0.0.1';
    const PASS = process.env.REDIS_PASSWORD || '';

    await redis.connect({ user: process.env.REDIS_USER || '', password: PASS, host: HOST, port: parseInt(PORT) });

} 

beforeAll( async () => {

    // env vars //make changes
    config();

    // conn options
    const options: object = {
        useNewUrlParser: true,
        autoIndex: true,
        keepAlive: true,
        maxPoolSize: 1000,
        wtimeoutMS:60000,
        connectTimeoutMS: 60000,
        socketTimeoutMS: 60000,
        serverSelectionTimeoutMS: 60000,
        family: 4,
        useUnifiedTopology: true
    }

    // connect to redis
    await connectRedis();

    // connect to DB
    dbConn = await mongoose.connect(process.env.MONGODB_TEST_URI || '', options);
    console.log(colors.cyan.bold.underline(`Database connected: ${dbConn.connection.host}`));

    // seed data
    await seedData();

})

beforeEach( async () => {

    // write some program to run before each test
    // jest.useFakeTimers()

})

afterAll( async () => {

    // close connection
    await dbConn.connection.close();

})