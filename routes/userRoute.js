
const express = require('express');
const path = require('path');
const multer = require('multer');  // import first
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const auth = require('../middleware/auth.js');
const userControllers = require('../controllers/userControllers.js');
const Group = require('../models/groupModel.js');
const Member = require('../models/memberModal.js');
const user_route = express();

user_route.use(cookieParser());
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended: true}));
user_route.set('view engine', 'ejs');
user_route.set('views', path.join(__dirname, '../view'));
user_route.use(express.static(path.join(__dirname, '../public')));


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });




user_route.get('/register', auth.isLogout,userControllers.registerLoad);
user_route.post('/register', upload.single('image'), userControllers.register);

user_route.get('/',auth.isLogout ,userControllers.loadLogin);
user_route.post('/', userControllers.login);
user_route.get('/logout',auth.isLogin ,userControllers.logout);
user_route.get('/dashboard', auth.isLogin,userControllers.loadDashboard);

user_route.post('/save-chat', userControllers.saveChat);
user_route.post('/delete-chat', userControllers.deleteChat);
user_route.post('/update-chat', userControllers.updateChat);


user_route.post('/groups', auth.isLogin, upload.single('image'), userControllers.createGroup);

user_route.post('/get-members', auth.isLogin, userControllers.getMembers);
user_route.post('/add-members', auth.isLogin, userControllers.addMembers);
user_route.post('/update-chat-group', upload.single('image'), userControllers.updateChatGroup);
user_route.post('/delete-chat-group',auth.isLogin, userControllers.deleteChatGroup);
user_route.get('/share-group/:id', userControllers.shareGroup);
user_route.post('/join-group', userControllers.joinGroup);
user_route.get('/group-chat',auth.isLogin, userControllers.groupChat);
user_route.post('/group-save-chat', userControllers.saveGroupChat);
user_route.post('/load-group-chats', userControllers.loadGroupChat);
user_route.post('/delete-group-chat', userControllers.deleteGroupChat);
user_route.post('/update-group-chat', userControllers.updateGroupChat);
user_route.post('/refresh-token', userControllers.refreshToken);

const User = require('../models/userModel.js');

// GET groups - combined created + joined
user_route.get('/groups', auth.isLogin, async(req, res) => {
    try {
        const userId = req.session.user?._id || req.user?.id;

        if(req.headers['x-requested-with'] === 'flutter') {
            const myGroups = await Group.find({creator_id: userId});
            const memberships = await Member.find({user_id: userId}).populate('group_id');
            const joinedGroups = memberships
                .filter(m => m.group_id)
                .map(m => m.group_id);
            const allGroupIds = new Set(myGroups.map(g => g._id.toString()));
            const combined = [...myGroups];
            joinedGroups.forEach(g => {
                if(!allGroupIds.has(g._id.toString())) combined.push(g);
            });
            return res.json({success: true, groups: combined});
        }

        const groups = await Group.find({creator_id: req.session.user._id});
        res.render('group', {user: req.session.user, groups, message: undefined});
    } catch(error) {
        console.log('getGroups error:', error.message);
        if(req.headers['x-requested-with'] === 'flutter') {
            return res.status(500).json({success: false, message: error.message});
        }
    }
});

// GET users for dashboard - MUST be before wildcard
user_route.get('/api/users', auth.isLogin, async(req, res) => {
    try {
        const userId = req.session.user?._id || req.user?.id;
        const users = await User.find({
            _id: { $nin: [userId] }
        }).select('name email image is_online');
        res.json({ success: true, users });
    } catch(error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// wildcard MUST be last
user_route.use(function(req, res){
    res.redirect('/');
});

module.exports = user_route;