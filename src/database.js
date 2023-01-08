
import postgres from 'postgres';

export default class Database {
    constructor(string) {
        this.sql = postgres(string);
    }

    async getUsers() {
        return await this.sql`SELECT user_id as id, username, email, full_name as fullname, description, tags, youtube_key as youtubekey FROM appuser`;
    }

    async getUser(id) {
        const users = await this.sql`SELECT user_id as id, username, email, full_name as fullname, description, tags, youtube_key as youtubekey FROM appuser WHERE user_id = ${id}`;
        if(users.count == 1) {
            return users[0];
        } else {
            return null;
        }
    }

    async getUserByUsername(username) {
        const users = await this.sql`SELECT user_id as id, username, email, full_name as fullname, description, tags, youtube_key as youtubekey FROM appuser WHERE username = ${username}`;
        if(users.count == 1) {
            return users[0];
        } else {
            return null;
        }
    }

    async updateUserInfo(user) {
        if(user.fullname == undefined) {
            user.fullname = null;
        }

        if(user.description == undefined) {
            user.description = null;
        }

        if(user.tags == undefined) {
            user.tags = null;
        }

        if(user.youtubekey == undefined) {
            user.youtubekey = null;
        }

        console.log(user);

        await this.sql`UPDATE appuser 
            SET full_name = ${user.fullname}, description = ${user.description}, tags = ${user.tags}, youtube_key = ${user.youtubekey}
            WHERE user_id = ${user.id} AND username = ${user.username}`;
    }

    async getUserProfileImage(username) {
        const image_uuids = await this.sql`SELECT profile_image FROM appuser WHERE username = ${username}`;
        if(image_uuids && image_uuids.count == 1) {
            return image_uuids[0].profile_image;
        } else {
            return null;
        }
    }

    async getUserProfileImageById(id) {
        const image_uuids = await this.sql`SELECT profile_image FROM appuser WHERE user_id = ${id}`;
        if(image_uuids && image_uuids.count == 1) {
            return image_uuids[0].profile_image;
        } else {
            return null;
        }
    }

    async setUserProfileImage(username) {
        await this.sql`UPDATE appuser SET profile_image = gen_random_uuid () WHERE username = ${username}`;
    }

    async getUserSoundClip(username, id) {
        if(id != 1 || id != 2) {
            return null;
        }

        const clip_uuids = await this.sql`SELECT sound_clip_1 as sound_clip FROM appuser WHERE username = ${username}`;
        if(clip_uuids && clip_uuids.count == 1) {
            return clip_uuids[0].sound_clip;
        } else {
            return null;
        }
    }

    async setUserSoundClip(username, id) {
        if(id != 1 || id != 2) {
            return;
        }

        await this.sql`UPDATE appuser SET sound_clip_1 = gen_random_uuid () WHERE username = ${username}`;
    }

    async getUserAccount(username) {
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

    async getUserConversationList(username) {
        const user = await this.getUserByUsername(username);
        if(!user) {
            return null;
        }

        console.log('getUserConversationList');
        console.log(user);

        const conversations = await this.sql`
            SELECT u.user_id as id, u.full_name as full_name
            FROM appuser u 
            INNER JOIN message m ON u.user_id = m.from_id OR u.user_id = m.to_id
            WHERE (m.to_id = ${user.id} OR m.from_id = ${user.id}) AND u.user_id != ${user.id}
            GROUP BY u.user_id, u.username`;

        if(conversations && conversations.count > 0) {
            return conversations;
        } else {
            return null;
        }
    }

    async getUserConversation(username, other_user_id) {
        const user = await this.getUserByUsername(username);
        if(!user) {
            return null;
        }

        const converstion = await this.sql`
            SELECT message_id as id, text, from_id as from, to_id as to
            FROM message
            WHERE (to_id = ${user.id} AND from_id = ${other_user_id}) OR (to_id = ${other_user_id} AND from_id = ${user.id})
            ORDER BY time ASC`;

        if(converstion && converstion.count > 0) {
            return converstion;
        } else {
            return null;
        }
    }

    async addMessage(username, other_user_id, message) {
        const user = await this.getUserByUsername(username);
        if(!user) {
            return;
        }

        console.log('getUserByUsername');
        console.log(user);
        console.log(other_user_id);
        console.log(message);

        if(user.id == other_user_id) {
            return;
        }

        await this.sql`
            INSERT INTO message (message_id, text, time, from_id, to_id) 
            VALUES (DEFAULT, ${message}, CURRENT_TIMESTAMP, ${user.id}, ${other_user_id});
        `;
    }
};
