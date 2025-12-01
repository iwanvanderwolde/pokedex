import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import indexRouter from './routes/index.js';
import cors from 'cors'
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path'
import passport from 'passport';
import passportConfig from "./passportConfig.js";

import 'dotenv/config'


const app = express();
const corsOptions = {
    // origin: ['http://localhost:3000'], // allow ports and urls
    // credentials: true, // sends the username // cookies.
    // optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const db = new Database(path.dirname(fileURLToPath(import.meta.url)) + '/../pokemon.db', {fileMustExist: true});

passportConfig(passport);

app.use(passport.initialize());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use('/', indexRouter);


export {db}
export default app;
