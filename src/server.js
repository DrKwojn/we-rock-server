
import dotenv from 'dotenv';
import express from 'express';
import postgres from 'postgres';

dotenv.config();

const sql = postgres(process.env.POSTGRES);

const users = await sql`SELECT username FROM appuser`;
console.log(users);

const port = process.env.EXPRESS_PORT;

const app = express();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});