const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcrypt");
const User = require("../models/User");

function generatePassword() {

  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "@$!%*?&";

  const all = upper + lower + numbers + special;

  let password =
    upper[Math.floor(Math.random() * upper.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    special[Math.floor(Math.random() * special.length)];

  for (let i = 0; i < 5; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password;
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback"
    },

    async (accessToken, refreshToken, profile, done) => {

      try {

        const email = profile.emails[0].value;

        let user = await User.findOne({ email });

        if (!user) {

          const plainPassword = generatePassword();

          const hashedPassword = await bcrypt.hash(plainPassword, 10);

          user = await User.create({
            name: profile.displayName,
            username: email.split("@")[0],
            email: email,
            password: hashedPassword,
            googleId: profile.id
          });

          user.generatedPassword = plainPassword;
        }

        return done(null, user);

      } catch (err) {
        return done(err, null);
      }

    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {

  try {

    const user = await User.findById(id);

    done(null, user);

  } catch (err) {

    done(err, null);

  }

});