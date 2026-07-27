
const express = require('express');
const userControllers = require('../controllers/userControllers.js');
const user_route = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const storage = multer.memoryStorage();
const { uploadToCloudinary } = require('../helpers/cloudinary');
const auth = require('../middleware/auth.js');
const multer = require('multer');

user_route.use(cookieParser());

user_route.use(bodyParser.json());

user_route.use(bodyParser.urlencoded({extended: true}));

user_route.set('view engine', 'ejs');

user_route.set('views', './view');

user_route.use(express.static('./public'));



const upload = multer({ storage: multer.memoryStorage() });


user_route.get('/register', auth.isLogout,userControllers.registerLoad);
user_route.post('/register', upload.single('image'), userControllers.register);

user_route.get('/',auth.isLogout ,userControllers.loadLogin);
user_route.post('/', userControllers.login);
user_route.get('/logout',auth.isLogin ,userControllers.logout);
user_route.get('/dashboard', auth.isLogin,userControllers.loadDashboard);

user_route.post('/save-chat', userControllers.saveChat);
user_route.post('/delete-chat', userControllers.deleteChat);
user_route.post('/update-chat', userControllers.updateChat);

user_route.get('/groups', auth.isLogin, userControllers.loadGroups);
user_route.post('/groups', upload.single('image'), userControllers.createGroup);

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
user_route.use(function(req, res){
    res.redirect('/');
});

module.exports = user_route;
