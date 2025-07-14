import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import GitHubStrategy from "passport-github2";
import LinkedInStrategy from "passport-linkedin-oauth2";

import dotenv from "dotenv";
dotenv.config();

// ✅ Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ["user:email"],
    },
    (accessToken, refreshToken, profile, done) => {
      done(null, {
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        provider: "google",
      });
    }
  )
);

// ✅ GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback",
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      let email = null;

      if (profile.emails && profile.emails.length > 0) {
        email = profile.emails[0].value;
      } else {
        // 🔁 Fetch primary email if not included in profile
        try {
          const response = await fetch("https://api.github.com/user/emails", {
            headers: {
              Authorization: `token ${accessToken}`,
              "User-Agent": "Node.js",
            },
          });

          const emails = await response.json();
          const primaryEmailObj = emails.find(
            (emailObj) => emailObj.primary && emailObj.verified
          );

          email = primaryEmailObj ? primaryEmailObj.email : null;
        } catch (error) {
          return done(error, null);
        }
      }

      if (!email) {
        return done(new Error("No email found in GitHub profile"), null);
      }

      done(null, {
        id: profile.id,
        email,
        name: profile.username,
        provider: "github",
      });
    }
  )
);

/**
// 🔒 LinkedIn Strategy (optional - currently commented out)
passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: "/api/auth/linkedin/callback",
      scope: ["r_emailaddress", "r_liteprofile"],
      state: true, // recommended for CSRF protection
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const provider = "linkedin";

        const userData = { email, name, provider };
        done(null, userData);
      } catch (error) {
        done(error, null);
      }
    }
  )
);
*/

export default passport;
