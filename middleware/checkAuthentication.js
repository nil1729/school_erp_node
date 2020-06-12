module.exports = (req, res, next) => {
    if(req.isAuthenticated()){
        next();
    }else{
        req.flash('error', 'You are  not logged in');
        res.redirect('/');
    }
};