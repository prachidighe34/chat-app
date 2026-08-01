cat > /home/prachi/taskChatApp/backend/middleware/auth.js << 'EOF'
const jwt = require('jsonwebtoken');

const isLogin = async(req, res, next) => {
    try {
        if(req.session.user) return next();

        const token = req.headers.authorization?.split(' ')[1];
        
        if(token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log('JWT decoded:', decoded);
                req.user = decoded;
                return next();
            } catch(jwtError) {
                console.log('JWT Error:', jwtError.message);
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

module.exports = { isLogin, isLogout };
