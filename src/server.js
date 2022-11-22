
import dotenv from 'dotenv';
import fs from 'fs';

import https from 'https';
import express from 'express';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import postgres from 'postgres';

dotenv.config();

const credentials = {
    key:  fs.readFileSync('./cert/server.key', 'utf-8'),
    cert: fs.readFileSync('./cert/server.crt', 'utf-8')
}

const sql = postgres(process.env.POSTGRES);

const app = express();
app.use(express.json());

const authenticate = (req, res, next) => {
    const header = req.headers['authorization'];
    if(!header) {
        console.log('Missing auth header');
        return res.sendStatus(401);
    }

    const token = header.split(' ')[1];
    if(!token) {
        console.log('Missing auth token');
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
        if(error){
            console.log('Token not verified');
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    });
}

app.get('/', (req, res) => {
    res.send('WeRockServer');
});

app.get('/user/list', authenticate, async (req, res) => {
    const users = await sql`SELECT username FROM appuser`;
    console.log(users);
    res.json(users);
});

app.post('/register', async (req, res) => {
    if(!req.body || !req.body.username || !req.body.password || !req.body.email){
        console.log('Missing username, password and/or email');
        res.sendStatus(400);
        return;
    }

    const users = await sql`SELECT username, email, password FROM appuser WHERE username = ${req.body.username} OR email = ${req.body.email}`;
    console.log(users.count);
    if(users.count > 0){
        console.log('User with username and/or email already exists');
        res.sendStatus(400);
        return;
    }

    let password;
    try {
        password = await bcrypt.hash(req.body.password, 10);
    } catch {
        console.log('Failed to hash password');
        res.sendStatus(400);
        return;
    }

    const result = await sql`
        INSERT INTO appuser (user_id, username, email, password) 
            VALUES (DEFAULT, ${req.body.username}, ${req.body.email}, ${password})
        `;

    res.sendStatus(300);
});

app.post('/login', async (req, res) => {
    if(!req.body || !req.body.username || !req.body.password){
        console.log('Missing username and/or password');
        res.sendStatus(400);
        return;
    }

    const username = req.body.username;
    const password = req.body.password;

    const users = await sql`SELECT username, password FROM appuser WHERE username = ${username}`;
    if(users.count != 1){
        console.log('Wrong username');
        res.sendStatus(400);
        return;
    }

    const user = users[0];

    let result;
    try {
        result = await bcrypt.compare(password, user.password);
    } catch {
        console.log('Failed to compare passwords');
        res.sendStatus(400);
        return;
    }

    if(!result){
        console.log('Wrong password');
        res.sendStatus(400);
        return;
    }

    const acessToken = jwt.sign(user.username, process.env.ACCESS_TOKEN_SECRET);
    res.json({acessToken: acessToken});
});

const server = https.createServer(credentials, app);

server.listen(process.env.EXPRESS_PORT);
