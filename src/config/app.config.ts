import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import { config } from 'dotenv';
import morgan from 'morgan';
import colors from 'colors';
import fileUpload from 'express-fileupload';
import cookieParser from 'cookie-parser';
import expressSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import xss from 'xss-advanced';
import { limitRequests } from '../middleware/rateLimiter.mw';
import hpp from 'hpp';
import cors from 'cors';
import userAgent from 'express-useragent';

// files
import errorHandler from '../middleware/error.mw'

// load the env file
config();

import v1Routes from '../routes/v1/routes.router';

//express
const app = express();

// view engine
app.set('view engine', 'ejs');

// cookie parser
app.use(cookieParser());

// body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Dev logging middleware
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

// temporary files directory
app.use(fileUpload({ useTempFiles: true, tempFileDir: path.join(__dirname, 'tmp') }));

// sanitize data
// secure db against SQL injection
app.use(expressSanitize());

// set security headers ::: it adds more headers to request
app.use(helmet());

// rate limiting
app.use(limitRequests);

// prvent http parameter pollution
app.use(hpp());

// enable CORS
// communicate with multiple domains
app.use(cors({ origin: true, credentials: true }));

// cors middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header("Access-Control-Allow-Headers", "x-access-token, Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// set static folder
app.use(express.static(path.join(__dirname, 'public')));

// user agent
app.use(userAgent.express());

// mount routers
app.get('/', (req: Request, res: Response, next: NextFunction) => {

    res.status(200).json({
        error: false,
        errors: [],
        message: 'successful',
        data: {
            name: 'tma-identity-service',
            version: '1.0.0'
        },
        status: 200
    })

});

app.use(`${process.env.API_ROUTE}/v1`, v1Routes);

// mount error handlers. This must be after you mount routers
app.use(errorHandler);

export default app;