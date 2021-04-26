const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { OAuth2Strategy: GoogleStrategy } = require('passport-google-oauth');
const config = require('config');

module.exports = async (passport) => {
    passport.use(new LocalStrategy({usernameField: 'email'}, async (email, password, done)=> {
        try {
            const user = await User.findOne({email});
            if(!user){
                return done(null, false, {message: 'Authentication Error'});
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if(!isMatch){
                return done(null, false, {message: 'Authentication Error'});
            }
            return done(null, user, {message: 'Successfully Logged in'});
        } catch (e) {
            return done(e);          
        }
    }));
    passport.serializeUser((user, done)=> {
        return done(null, user.id);
    });
    passport.deserializeUser((id, done)=> {
        User.findById(id, (err, user)=>{
            return done(err, user);
        });
    });

    const googleStrategyConfig = new GoogleStrategy({
        clientID: config.get("GOOGLE_ID"),
        clientSecret: config.get("GOOGLE_SECRET"),
        callbackURL: '/auth/google/callback',
        passReqToCallback: true
      }, async (req, accessToken, refreshToken, params, profile, done) => {
        try {
            const email = profile.emails[0].value;
            const user = await User.findOne({email});
            if(!user){
                return done(null, false, {message: 'Authentication Error'});
            }
            return done(null, user, {message: 'Successfully Logged in'});
        } catch (e) {
            return done(e);          
        }
      });
      passport.use('google', googleStrategyConfig);
};