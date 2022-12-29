
import postgres from 'postgres';

export default class Database {
    constructor(string) {
        this.sql = postgres(string);
    }

    async getUsers() {
        return await this.sql`SELECT username FROM appuser`;
    }

    async getUser(username) {
        const users = await this.sql`SELECT user_id as id, username, password FROM appuser WHERE username = ${username}`;
        if(users.count == 1) {
            return users[0];
        } else {
            return null;
        }
    }

    async addUser(username, email, password) {
        await this.sql`
            INSERT INTO appuser (user_id, username, email, password) 
            VALUES (DEFAULT, ${username}, ${email}, ${password})
        `;
    }

    async userExists(username, email) {
        const users = await this.sql`SELECT user_id as id FROM appuser WHERE username = ${username} OR email = ${email}`;
        return users.count > 0;
    }
};
