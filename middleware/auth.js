const jwt = require('jsonwebtoken');

const isLogin = async(req, res, next) => {
    try {
        if(req.session.user) return next();

        const token = req.headers.authorization?.split(' ')[1];
        if(token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded JWT:', decoded); // add this
            req.user = decoded;
            return next();
        }

        if(req.headers['x-requested-with'] === 'flutter') {
            return res.status(401).json({success: false, message: 'Unauthorized'});
        }
        res.redirect('/');
    } catch(error) {
        console.log('Auth error:', error.message);
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