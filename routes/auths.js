const express = require('express');
const router = express.Router();
const passport = require('passport');

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

module.exports = router;