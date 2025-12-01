import { Strategy, ExtractJwt } from 'passport-jwt';
import 'dotenv/config';
import { db } from './app.js';

export default (passport) => {
    passport.use(
        new Strategy(
            {
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: process.env.APP_KEY,
            },
            async (jwt_payload, done) => {
                try {

                    const query = "SELECT * FROM users WHERE email = ? OR name = ?";
                    const user = db.prepare(query).get(jwt_payload.email_or_username, jwt_payload.email_or_username);
                    console.log(jwt_payload)

                    if (user) {
                        return done(null, user);
                    } else {
                        return done(null, false);
                    }
                } catch (error) {
                    return done(error, false);
                }
            }
        )
    );
};
