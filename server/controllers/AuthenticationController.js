import * as argon2 from "argon2";
import {v4 as uuidv4} from "uuid";
import jsonwebtoken from "jsonwebtoken";

class AuthenticationController {
    static db = null;

    static async initializeDb() {
        if (!this.db) {
            const {db: importedDb} = await import("../app.js");
            this.db = importedDb;
            console.log("✅ Database initialized");
        }
    }

    static async registerUser(username, email, password) {
        await this.initializeDb();
        const query_check = "SELECT * FROM main.users WHERE email = ?";
        const result = this.db.prepare(query_check).get(email);
        if (result) {
            return {error: "User already exists"};
        }
        const hash = await argon2.hash(
            password,
            {
                secret: Buffer.from(process.env.APP_SECRET)
            });
        const query = "INSERT INTO main.users (id, name, email, password) VALUES (?,?,?, ?)";
        this.db.prepare(query).run(uuidv4(), username, email, hash);
        return {success: "User registered successfully"}
    }

    static async loginUser(email_or_username, password) {
        await this.initializeDb();
        let email_or_Username = "";
        let result = undefined;
        console.log(email_or_username, password);
        if (email_or_username.includes("@")) {
            email_or_Username = "email";
            const query = "SELECT * FROM main.users WHERE email = ?";
            result = this.db.prepare(query).get(email_or_username);
        } else {
            email_or_Username = "username";
            const query = "SELECT * FROM main.users WHERE name = ?";
            result = this.db.prepare(query).get(email_or_username);
        }

        if (!result) {
            console.log(`User with ${email_or_Username} ${email_or_username} not found`);
            return {error: "User not found"};
        }
        const verify = await argon2.verify(
            result.password,
            password,
            {
                secret: Buffer.from(process.env.APP_SECRET)
            }
        );
        if (!verify) {
            console.log(`Invalid password for user with ${email_or_Username} ${email_or_username}`);
            return {error: "Invalid password"};
        } else {
            const token = jsonwebtoken.sign(
                {email_or_username: email_or_username},
                process.env.APP_KEY,
                {expiresIn: "3h"}
            );
            console.log(`User with ${email_or_Username} ${email_or_username} logged in successfully`);


            return {
                success: "User logged in successfully", token: token
            };
        }
    }

    static async getUsers() {
        await this.initializeDb();
        const query = "SELECT * FROM main.users";

        const data  = this.db.prepare(query).all();
        console.log(data, "data")
        return data;
    }
    // auth.js

}

export default AuthenticationController;