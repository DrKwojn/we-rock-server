
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import https from 'https';
import express from 'express';
import fileUpload from 'express-fileupload';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import Database from './database.js'
import Errors from './errors.js'
import util from './util.js'

dotenv.config();

const image_path = path.resolve(process.env.FILE_IMAGES_PATH) + '/';
const sound_path = path.resolve(process.env.FILE_SOUNDS_PATH) + '/';

const credentials = {
    key:  fs.readFileSync('./cert/server.key', 'utf-8'),
    cert: fs.readFileSync('./cert/server.crt', 'utf-8')
}

const database = new Database(process.env.POSTGRES);

const app = express();
app.use(express.json());
app.use(fileUpload());

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
    res.json(users);
});

app.get('/user/current', authenticate, async (req, res) => {
    const user = await database.getUserByUsername(req.user);
    console.log(user);
    res.json(user);
});

app.get('/user/:id', authenticate, async (req, res) => {
    const user = await database.getUser(req.params.id);
    console.log(user);
    res.json(user);
});

app.put('/user/:id', authenticate, async (req, res) => {
    await database.updateUserInfo(req.body);
    res.sendStatus(200);
});

app.get('/image/download/:id', authenticate, async (req, res) => {
    const image_uuid = await database.getUserProfileImageById(req.params.id);
    console.log(image_uuid);

    if(!image_uuid) {
        console.log('User has no image set');
        return res.status(Errors.FILE_NO_PROFILE_IMAGE.code).json(Errors.FILE_NO_PROFILE_IMAGE);
    }

    const filepath = util.findFileInDir(image_path, image_uuid);
    if(!filepath) {
        console.log('Profile image missing');
        return res.status(Errors.FILE_NO_PROFILE_IMAGE.code).json(Errors.FILE_NO_PROFILE_IMAGE);
    }
 
    console.log('Downloading image file ' + filepath);
    res.download(filepath);
});

app.post('/image/upload', authenticate, async (req, res) => {
    if(!req.files || Object.keys(req.files).length === 0) {
        return res.status(Errors.FILE_UPLOAD_MISSING.code).send(Errors.FILE_UPLOAD_MISSING);
    }

    const old_image_uuid = await database.getUserProfileImage(req.user);
    if(old_image_uuid) {
        util.findAndDeleteFileInDir(image_path, old_image_uuid);
    }

    await database.setUserProfileImage(req.user);
    const image_uuid = await database.getUserProfileImage(req.user);

    const file = req.files.file;
    const extension = file.name.split('.').pop();
    const path = image_path + image_uuid + '.' + extension;

    try {
        await file.mv(path);
    } catch(error) {
        console.log('Failed to store file')
        console.log(error);
        return res.status(Errors.FILE_STORING_FAILED.code).json(Errors.FILE_STORING_FAILED);
    }

    console.log("Uploaded image");
    res.sendStatus(200);
});

app.get('/sound/download/:id', authenticate, async (req, res) => {
    const sound_uuid = await database.getUserSoundClip(req.user, req.params.id);
    console.log(sound_uuid);

    if(!sound_uuid) {
        console.log('User has no sound clip set');
        return res.status(Errors.FILE_NO_SOUND_CLIP.code).json(Errors.FILE_NO_SOUND_CLIP);
    }

    const filepath = util.findFileInDir(sound_path, sound_uuid);
    if(!filepath) {
        console.log('Sound clip missing');
        return res.status(Errors.FILE_NO_SOUND_CLIP.code).json(Errors.FILE_NO_SOUND_CLIP);
    }
 
    console.log('Downloading sound file ' + filepath);
    res.download(filepath);
});

app.post('/sound/upload/:id', authenticate, async (req, res) => {
    if(!req.files || Object.keys(req.files).length === 0) {
        return res.status(Errors.FILE_UPLOAD_MISSING.code).send(Errors.FILE_UPLOAD_MISSING);
    }

    const old_sound_uuid = await database.getUserSoundClip(req.user, req.params.id);
    console.log('Old file');
    console.log(old_sound_uuid);
    if(old_sound_uuid) {
        util.findAndDeleteFileInDir(sound_path, old_sound_uuid);
    }

    await database.setUserSoundClip(req.user, req.params.id);
    const sound_uuid = await database.getUserSoundClip(req.user, req.params.id);
    console.log('New file');
    console.log(sound_uuid);

    const file = req.files.file;
    const extension = file.name.split('.').pop();
    const path = sound_path + sound_uuid + '.' + extension;

    try {
        await file.mv(path);
    } catch(error) {
        console.log('Failed to store file')
        console.log(error);
        return res.status(Errors.FILE_STORING_FAILED.code).json(Errors.FILE_STORING_FAILED);
    }

    console.log("Uploaded sound clip");
    res.sendStatus(200);
});

app.get('/chat/list', authenticate, async (req, res) => {
    const chatList = await database.getUserConversationList(req.user);
    res.json(chatList);
});

app.get('/chat/:id', authenticate, async (req, res) => {
    const chat = await database.getUserConversation(req.user, req.params.id);
    res.json(chat);
});

app.post('/chat/:id', authenticate, async (req, res) => {
    console.log(req.params);
    console.log(req.body.text);
    await database.addMessage(req.user, req.params.id, req.body.text);
    res.sendStatus(200);
});

app.post('/register', async (req, res) => {
    if(!req.body || !req.body.username || !req.body.password || !req.body.email){
        console.log('Missing username, password and/or email');
        res.status(Errors.REG_MISSING.code).json(Errors.REG_MISSING);
        return;
    }
    
    let exists;
    try {
        exists = await database.userExists(req.body.username, req.body.email);
    } catch(error) {
        console.log('Database failure');
        console.log(error);
        res.status(Errors.DATABASE_FAILURE.code).json(Errors.DATABASE_FAILURE);
        return;
    }

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

    try {
        await database.addUser(req.body.username, req.body.email, password);
    } catch (error) {
        console.log('Database failure');
        console.log(error);
        res.status(Errors.DATABASE_FAILURE.code).json(Errors.DATABASE_FAILURE);
        return;
    }

    console.log('Registered ' + req.body.username);
    res.sendStatus(200);
});

app.post('/login', async (req, res) => {
    if(!req.body || !req.body.username || !req.body.password){
        console.log('Missing username and/or password');
        res.status(Errors.LOGIN_MISSING.code).json(Errors.LOGIN_MISSING);
        return;
    }

    const username = req.body.username;
    const password = req.body.password;

    let user;
    try {
        user = await database.getUserAccount(username);
    } catch (error) {
        console.log('Database failure');
        console.log(error);
        res.status(Errors.DATABASE_FAILURE.code).json(Errors.DATABASE_FAILURE);
        return;
    }

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

app.post('/validate', authenticate, async (req, res) => {
    if(!req.user) {
        res.status(Errors.AUTH_UNVERIFIED_TOKEN.code).json(Errors.AUTH_UNVERIFIED_TOKEN);
    }

    const user = await database.getUserAccount(req.user);

    if(!user){
        console.log('Not a valid user');
        res.status(Errors.AUTH_UNVERIFIED_TOKEN.code).json(Errors.AUTH_UNVERIFIED_TOKEN);
        return;
    }

    res.sendStatus(200);
});

const server = https.createServer(credentials, app);

server.listen(process.env.EXPRESS_PORT);
