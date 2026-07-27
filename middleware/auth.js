const jwt = require('jsonwebtoken');

// in middleware/auth.js - already done earlier but verify it's there
const isLogin = async(req, res, next) => {
    try {
        if(req.session.user) return next();

        const token = req.headers.authorization?.split(' ')[1];
        if(token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            return next();
        }
        res.redirect('/');
    } catch(error) {
        res.redirect('/');
    }
}
const isLogout = async (req, res, next) => {
    try {
        if (req.session.user) {
          res.redirect('/dashboard'); 
        } 
        else{
            next();
        }
    } catch (error) {
    console.log(error.message);
    }
}

module.exports = {
    isLogin,
    isLogout
}