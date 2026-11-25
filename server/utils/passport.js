const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user.schema');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/v1/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // 2. If not, check if they signed up with email previously
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link Google ID to their existing email account
            user.googleId = profile.id;
            await user.save();
          } else {
            // 3. Create a brand new user
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
            });
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);