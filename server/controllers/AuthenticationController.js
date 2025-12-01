// javascript
import * as argon2 from "argon2";
import {v4 as uuidv4} from "uuid";
import jsonwebtoken from "jsonwebtoken";

class AuthenticationController {
    static db = null;

    static async initializeDb() {
        if (!this.db) {
            // Dynamic import so the app can import this controller without causing a circular dependency
            const {db: importedDb} = await import("../app.js");
            this.db = importedDb;
            console.log("✅ Database initialized");
        }
    }

    static async registerUser(username, email, password) {
        await this.initializeDb();

        // Check for existing user by email
        const query_check = "SELECT * FROM main.users WHERE email = ?";
        const result = this.db.prepare(query_check).get(email);
        if (result) {
            return {error: "User already exists"};
        }

        // Hash password with argon2 and an application-level secret for keyed hashing.
        // Ensure process.env.APP_SECRET is set in the environment (keeps hashes tied to the app).
        const hash = await argon2.hash(
            password,
            {
                secret: Buffer.from(process.env.APP_SECRET)
            });

        // Insert user using parameterized placeholders; uuidv4() provides a stable unique id
        const query = "INSERT INTO main.users (id, name, email, password) VALUES (?,?,?, ?)";
        this.db.prepare(query).run(uuidv4(), username, email, hash);

        return {success: "User registered successfully"}
    }

    static async loginUser(email_or_username, password) {
        await this.initializeDb();

        // Determine whether input is email or username
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

        // Verify hashed password using the same APP_SECRET for keyed verification
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
            // Create a short JWT containing only the identifier (avoid sensitive data in token)
            // Uses APP_KEY from env as the signing key
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
        // Return all users (careful: in production you may want to omit password hashes from results)
        const query = "SELECT * FROM main.users";

        const data  = this.db.prepare(query).all();
        console.log(data, "data")
        return data;
    }
    // auth.js

}

export default AuthenticationController;
