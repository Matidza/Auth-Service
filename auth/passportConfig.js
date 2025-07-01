import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import GitHubStrategy from "passport-github2";

import dotenv from "dotenv";
dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
}, (accessToken, refreshToken, profile, done) => {
    done(null, {
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        provider: "google"
    });
}));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback"
}, (accessToken, refreshToken, profile, done) => {
    done(null, {
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.username,
        provider: "github"
    });
}));

export default passport;