const express = require('express');
const router = express.Router();
const passport = require('passport');
const checkAuthentication = require('../middleware/checkAuthentication');
const bcrypt = require('bcrypt');
const User = require('../models/User');


// router.post('/register', async (req, res)=> {
//     const {email, name, role, username, password} = req.body;
//     const newUser = {
//         email,
//         name,
//         role,
//         username,
//         password: await bcrypt.hash(password, 10)
//     }
//     try{
//         let user = new User(newUser);
//         user = await user.save();
//          res.json({
//              user
//          });
//     }catch(e){
//          res.json({error: e});
//     };
// });



// Login Admin and Teachers via LOCAL Strategy
router.post('/login', passport.authenticate('local', {
    successFlash: true,
    successRedirect: '/admin/dashboard',
    failureFlash: true,
    failureRedirect: '/'
}),(req, res) => {});


router.get('/logout', checkAuthentication, async (req, res) => {
    req.logOut();
    res.redirect('/');
});

router.get('/change-password', checkAuthentication, async(req, res) => {
    res.render('auths/change_password');
});

router.post('/change-password', checkAuthentication, async (req, res) => {
    let {oldP, newP, newP2} = req.body;
    let errors = [];
    const user = req.user;
    const isMatch = await bcrypt.compare(oldP, user.password);
    if(!isMatch){
        errors.push(`Current Password don't match`);
    }
    if(newP !== newP2){
        errors.push('New passwords do not match.');
    }
    if(newP.trim() === ''){
        errors.push('Password cannot contain spaces only');
    }
    if(newP.length < 6){
        errors.push('Password should be atleast 6 characters long');
    }
    if(errors.length !== 0){
        return res.render('auths/change_password', {errors});
    }else{
        user.password = await bcrypt.hash(newP, 10);
        let result = await User.updateOne({_id: user._id}, user);
        return res.render('auths/change_password', {errors: ['Password Changed Succesfully']});
    }
});

module.exports = router;