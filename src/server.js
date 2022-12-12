
import dotenv from 'dotenv';
import fs from 'fs';

import https from 'https';
import express from 'express';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import Database from './database.js'

import Errors from './errors.js'

dotenv.config();

const credentials = {
    key:  fs.readFileSync('./cert/server.key', 'utf-8'),
    cert: fs.readFileSync('./cert/server.crt', 'utf-8')
}

const database = new Database(process.env.POSTGRES);

const app = express();
app.use(express.json());

const authenticate = (req, res, next) => {
    const header = req.headers['authorization'];
    if(!header) {
        console.log('Missing auth header');
        return res.status(Errors.AUTH_MISSING_HEADER.code).json(Errors.AUTH_MISSING_HEADER);
    }

    const token = header.split(' ')[1];
    if(!token) {
        console.log('Missing auth token');
        return res.status(Errors.AUTH_MISSING_TOKEN.code).json(Errors.AUTH_MISSING_TOKEN);
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
        if(error){
            console.log('Token not verified');
            return res.status(Errors.AUTH_UNVERIFIED_TOKEN.code).json(Errors.AUTH_UNVERIFIED_TOKEN);
        }

        req.user = user;
        next();
    });
}

app.get('/', (req, res) => {
    res.send('WeRockServer');
});

app.get('/user/list', authenticate, async (req, res) => {
    const users = await database.getUsers();
    console.log(users);
    res.json(users);
});

app.post('/register', async (req, res) => {
    if(!req.body || !req.body.username || !req.body.password || !req.body.email){
        console.log('Missing username, password and/or email');
        res.status(Errors.REG_MISSING.code).json(Errors.REG_MISSING);
        return;
    }

    const exists = await database.userExists(req.body.username, req.body.email);
    if(exists) {
        console.log('User with username and/or email already exists');
        res.status(Errors.REG_USER_EXISTS.code).json(Errors.REG_USER_EXISTS);
        return;
    }

    let password;
    try {
        password = await bcrypt.hash(req.body.password, 10);
    } catch {
        console.log('Failed to hash password');
        res.status(Errors.REG_HASH_FAILED.code).json(Errors.REG_HASH_FAILED);
        return;
    }

    await database.addUser(req.body.username, req.body.email, password);

    console.log('Registered ' + req.body.username);
    res.sendStatus(300);
});

app.post('/login', async (req, res) => {
    if(!req.body || !req.body.username || !req.body.password){
        console.log('Missing username and/or password');
        res.status(Errors.LOGIN_MISSING.code).json(Errors.LOGIN_MISSING);
        return;
    }

    const username = req.body.username;
    const password = req.body.password;

    const user = await database.getUser(username);
    if(!user){
        console.log('Wrong username');
        res.status(Errors.LOGIN_WRONG.code).json(Errors.LOGIN_WRONG);
        return;
    }

    let result;
    try {
        result = await bcrypt.compare(password, user.password);
    } catch {
        console.log('Failed to compare passwords');
        res.status(Errors.LOGIN_WRONG.code).json(Errors.LOGIN_WRONG);
        return;
    }

    if(!result){
        console.log('Wrong password');
        res.status(Errors.LOGIN_WRONG.code).json(Errors.LOGIN_WRONG);
        return;
    }

    const accessToken = jwt.sign(user.username, process.env.ACCESS_TOKEN_SECRET);
    console.log('Logged in ' + user.username);
    res.json({accessToken: accessToken});
});

const server = https.createServer(credentials, app);

server.listen(process.env.EXPRESS_PORT);
