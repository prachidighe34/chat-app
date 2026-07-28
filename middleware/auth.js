const jwt = require('jsonwebtoken');

const isLogin = async(req, res, next) => {
    try {
        // session check for browser
        if(req.session.user) return next();

        // JWT check for Flutter
        const token = req.headers.authorization?.split(' ')[1];
        if(token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            return next();
        }

        // if Flutter request return JSON not redirect
        if(req.headers['x-requested-with'] === 'flutter') {
            return res.status(401).json({success: false, message: 'Unauthorized'});
        }

        res.redirect('/');
    } catch(error) {
        console.log(error.message);
        if(req.headers['x-requested-with'] === 'flutter') {
            return res.status(401).json({success: false, message: 'Token expired'});
        }
        res.redirect('/');
    }
}

const isLogout = async(req, res, next) => {
    try {
        if(req.session.user) {
            if(req.headers['x-requested-with'] === 'flutter') {
                return res.status(400).json({success: false, message: 'Already logged in'});
            }
            return res.redirect('/dashboard');
        }
        next();
    } catch(error) {
        console.log(error.message);
        next();
    }
}

module.exports = { isLogin, isLogout };