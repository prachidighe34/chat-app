const jwt = require('jsonwebtoken');

const isLogin = async(req, res, next) => {
    try {
        if(req.session.user) return next();

        const authHeader = req.headers.authorization;
        console.log('Auth header:', authHeader); // debug
        
        const token = authHeader?.split(' ')[1];
        console.log('Token:', token ? 'exists' : 'missing'); // debug
        
        if(token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded:', decoded); // debug
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