
const jwt = require('jsonwebtoken');

const isLogin = async(req, res, next) => {
    try {
        if(req.session.user) return next();

        const token = req.headers.authorization?.split(' ')[1];

        if(token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded;
                return next();
            } catch(jwtError) {
                console.log('JWT Error:', jwtError.message);
                // always return JSON for flutter requests
                if(req.headers['x-requested-with'] === 'flutter') {
                    return res.status(401).json({
                        success: false,
                        message: 'Token expired: ' + jwtError.message
                    });
                }
                return res.redirect('/');
            }
        }

        // no token — return JSON for flutter
        if(req.headers['x-requested-with'] === 'flutter') {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        res.redirect('/');

    } catch(error) {
        console.log('Auth error:', error.message);
        if(req.headers['x-requested-with'] === 'flutter') {
            return res.status(500).json({success: false, message: error.message});
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
