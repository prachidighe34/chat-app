const jwt = require('jsonwebtoken');

const isLogin = async(req, res, next) => {
    try {
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);
        
        if(req.session.user) return next();

        const token = req.headers.authorization?.split(' ')[1];
        console.log('Token received:', token ? token.substring(0, 20) + '...' : 'none');
        
        if(token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log('Decoded JWT:', decoded);
                req.user = decoded;
                return next();
            } catch(jwtError) {
                console.log('JWT verify failed:', jwtError.message);
                if(req.headers['x-requested-with'] === 'flutter') {
                    return res.status(401).json({
                        success: false,
                        message: 'JWT Error: ' + jwtError.message
                    });
                }
                return res.redirect('/');
            }
        }

        if(req.headers['x-requested-with'] === 'flutter') {
            return res.status(401).json({success: false, message: 'No token provided'});
        }
        res.redirect('/');

    } catch(error) {
        console.log('Auth middleware error:', error.message);
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
if(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('JWT decoded successfully:', decoded);
        req.user = decoded;
        return next();
    } catch(jwtError) {
        console.log('JWT Error name:', jwtError.name);
        console.log('JWT Error message:', jwtError.message);
        console.log('Token that failed:', token.substring(0, 30));
        console.log('Secret length:', process.env.JWT_SECRET?.length);
        
        if(req.headers['x-requested-with'] === 'flutter') {
            return res.status(401).json({
                success: false,
                message: 'JWT Error: ' + jwtError.name + ' - ' + jwtError.message
            });
        }
        return res.redirect('/');
    }
}
module.exports = { isLogin, isLogout };