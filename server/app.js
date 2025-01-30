import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import indexRouter from './routes/index.js';
import cors from 'cors'
const app = express();
const corsOptions = {
    // origin: ['http://localhost:3000'], // allow ports and urls
    // credentials: true, // sends the username // cookies.
    // optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use('/', indexRouter);

export default app;
