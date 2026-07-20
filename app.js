require('dotenv').config();

let mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log('MongoDB connection error:', err));
    
const app = require('express')();
const jwt = require('jsonwebtoken'); // add this

const User = require('./models/userModel.js');
const { Chat } = require('./models/chatModel.js');

const http = require('http').createServer(app);
const userRoute = require('./routes/userRoute.js');

app.set('view engine', 'ejs');

const session = require('express-session');
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use('/', userRoute);

const io = require('socket.io')(http);
const usp = io.of('/user-namespace');

// socket auth middleware
usp.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if(!token) return next(new Error('No token'));

    // JWT tokens are long (>30 chars), ObjectIds are 24 chars
    if(token.length > 30) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
        } catch(e) {
            socket.userId = token; // fallback during transition
        }
    } else {
        socket.userId = token; // plain ObjectId from session-based web app
    }
    next();
});

usp.on('connection', async function(socket){
    console.log('User Connected');

    // use socket.userId everywhere instead of handshake.auth.token
    const userId = socket.userId;

    await User.findByIdAndUpdate(userId, { $set: { is_online: '1' } });
    socket.broadcast.emit('getOnlineUser', { userId });

    socket.on('disconnect', async function(){
        console.log('User Disconnected');
        await User.findByIdAndUpdate(userId, { $set: { is_online: '0' } });
        socket.broadcast.emit('getOfflineUser', { userId });
    });

    socket.on('newChat', function(data){
        socket.broadcast.emit('loadNewChat', data);
    });

    socket.on('existingChat', async function(data){
        const chats = await Chat.find({
            $or: [
                { sender_id: data.sender_id, receiver_id: data.receiver_id },
                { sender_id: data.receiver_id, receiver_id: data.sender_id }
            ]
        });
        socket.emit('loadChats', { chats });
    });

    socket.on('chatDeleted', function(id){
        socket.broadcast.emit('loadDeletedChat', id);
    });

    socket.on('chatUpdated', function(data){
        socket.broadcast.emit('loadUpdatedChat', data);
    });

    socket.on('newGroupChat', function(data){
        socket.broadcast.emit('loadNewGroupChat', data);
    });

    socket.on('groupChatDeleted', function(id){
        socket.broadcast.emit('groupChatMessageDeleted', id);
    });

    socket.on('groupChatUpdated', function(data){
        socket.broadcast.emit('groupChatMessageUpdated', data);
    });
});

http.listen(3000, () => {
    console.log('server is running on port 3000');
});