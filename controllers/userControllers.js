const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const {Chat} = require('../models/chatModel');
const Group = require('../models/groupModel');
const Member = require('../models/memberModal');
const GroupChat = require('../models/groupChatModel');
const mongoose = require ("mongoose");
const jwt = require('jsonwebtoken');
const registerLoad = async (req, res) => {
 try{
        res.render('register');
 }
 catch(error){
    console.log(error.message);
 }
};

const register = async (req, res) => {
    try {
        const passwordHash = await bcrypt.hash(req.body.password, 10);

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            image: 'image/' + req.file.filename,
            password: passwordHash
        });

        await user.save();
        res.render('register', { message: 'Registration successful' });

    } catch (error) {
        console.log(error.message);  // add this
        res.render('register', { message: 'Registration failed. Try again.' });
    }
};

const loadLogin = async(req, res) => {
    try{
        res.render('login');
    }
    catch (error) {
        console.log(error.message);
    }
}



const login = async(req, res) => {
    try {
        const userData = await User.findOne({email: req.body.email});
        if(!userData) {
            return res.render('login', {message: "Email and Password Incorrect!"});
        }

        const passwordMatch = await bcrypt.compare(req.body.password, userData.password);
        if(!passwordMatch) {
            return res.render('login', {message: "Email and Password Incorrect!"});
        }

        const accessToken = jwt.sign(
            { id: userData._id, name: userData.name },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: userData._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // keep cookie for EJS frontend, add tokens for Flutter later
        res.cookie('user', JSON.stringify(userData));
        res.cookie('accessToken', accessToken, { httpOnly: true });
        res.cookie('refreshToken', refreshToken, { httpOnly: true });

        req.session.user = userData;
        res.redirect('/dashboard');

    } catch(error) {
        console.log(error.message);
    }
}
const refreshToken = async(req, res) => {
    try {
        const token = req.cookies.refreshToken || req.body.refreshToken;
        if(!token) return res.status(401).send({success: false, msg: 'No refresh token'});

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const accessToken = jwt.sign(
            { id: decoded.id },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
        res.send({success: true, accessToken});
    } catch(error) {
        res.status(401).send({success: false, msg: 'Invalid refresh token'});
    }
}
const logout = async(req, res) => {
    try{
       
        req.session.destroy();
        res.clearCookie('user');
        res.redirect('/');
    }
    catch (error) {
        console.log(error.message);
    }
}

const loadDashboard = async(req, res) => {
    try{
        let users= await User.find({_id : {$nin:[req.session.user._id]}});
        res.render('dashboard', {user : req.session.user, users: users});
    }
    catch (error) {
        console.log(error.message);
    }
}

const saveChat = async(req, res) => {
    try {
        let chat= new Chat({
            sender_id : req.body.sender_id,
            receiver_id : req.body.receiver_id,
            message : req.body.message
            
    });
        let newChat = await chat.save();
        res.status(200).send({ success: true, msg: "Message sent successfully", data: newChat });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
}

const deleteChat = async(req, res) => {
    try{
        await Chat.deleteOne({ _id: req.body.chatId });

        res.status(200).send({ success: true, msg: "Message deleted successfully" });
    }
    catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
}

const updateChat = async(req, res) => {
    try{
        await Chat.findByIdAndUpdate(req.body.chatId, { $set: { message: req.body.message } });
        res.status(200).send({ success: true, msg: "Message updated successfully" });
    }
    catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
}

const loadGroups = async(req, res) => {
    try {
        console.log('loadGroups called');
        console.log('session user:', req.session.user);
        
        const groups = await Group.find({creator_id: req.session.user._id});
        console.log('groups found:', groups.length);
        
        res.render('group', {
            user: req.session.user,
            groups: groups,
            message: undefined
        });
    } catch(error) {
        console.log('loadGroups ERROR:', error.message);
        console.log('full error:', error);
        res.send('Error: ' + error.message); // show error in browser
    }
}

const createGroup = async(req, res) => {
    try{

      const group = new Group({
            creator_id: req.session.user._id,
            name: req.body.group_name,
            image: 'image/' + req.file.filename,
            limit: req.body.limit
        });
        
        await group.save();

        const groups = await Group.find({creator_id: req.session.user._id});

        res.render('group',
            {
            message: req.body.group_name + " group created successfully",
            groups: groups,
            user: req.session.user
        });
    }
    catch (error) {
        console.log(error.message);
    }
}

const getMembers = async(req, res) => {
    try {
        let users = await User.aggregate([

            {
                $lookup:{
                    from:"members",
                    localField:"_id",
                    foreignField:"user_id",
                    pipeline:[
                        {
                            $match:{
                                $expr:{
                                    $and:[
                                        {$eq:["$group_id", req.body.group_id]}
                                    ]
                                }
                            }
                        }
                    ],
                    as:"member"
                }
            },
            {
                $match:{
                    "_id":{
                        $nin:[req.session.user._id]
                    }
                }
            }
        ]);
        res.status(200).send({success: true, data: users});
    } catch (error) {
        res.status(400).send({success : false, msg: error.message});
    }
}

const addMembers = async (req, res) => {
    try {

        if (!req.body.members) {
            res.status(200).send({success:false, msg:'Please select any one member '});
        }
        else if (req.body.members.length >parseInt(req.body.limit)){
            res.status(200).send({success:false, msg:'You cannot select more than' +req.body.limit+ 'members'});
        }
        else{

           await Member.deleteMany({ group_id:req.body.group_id});

            let data = [];

            const members = req.body.members;

            for(let i = 0; i < members.length; i++){
                data.push({
                    group_id: req.body.group_id,
                    user_id: members[i]
                });
            }

           await Member.insertMany(data);

            res.status(200).send({success:true, msg: 'Members added successfully!!'});
        }

    } catch (error) {
        res.status(400).send({success : false, msg: error.message});
    }
}

const updateChatGroup = async(req,res) => {
    try {
        if(parseInt(req.body.limit) < parseInt(req.body.last_limit)){
            await Member.deleteMany({group_id: req.body._id});
        }

        let updateObj;

        if(req.file != undefined){
            updateObj ={
                name : req.body.name,
                image : 'images/'+req.file.filename,
                limit: req.body.limit
            }
        }
        else{
            updateObj = {
                 name: req.body.name,
                limit: req.body.limit
            }
           
        }

        Group.findByIdAndUpdate({_id: req.body._id},{
            $set: updateObj
        });


        res.status(200).send({success:true, msg:'Chat Group updated successfully!!'});
    } catch (error) {
        res.status(400).send({success:false, msg:error.message});
    }
}

const deleteChatGroup = async (req,res) => {
    try {
        await Group.deleteOne({_id: req.body._id});
        await Member.deleteMany({group_id_id: req.body._id});
        res.status(200).send({success:true,msg:'Group deleted successfully!!'});
    } catch (error) {
        res.status(400).send({success:false,msg:error.message});
    }
}


const shareGroup = async (req,res) => {
    try {
        let groupData = await Group.findOne({_id: req.body.params._id});
        if(!groupData){
            res.render('error',{message: '404 not found!'}); 
        }
        else if(req.session.user == undefined){
            res.render('error',{message: 'You need to login to access the group invite!'});
        }
        else{
          let totalMembers =  await Member.find({group_id: req.params.id}).count();
          let available =  groupData.limit - totalMembers;

          let isOwner = groupData.creator_id == req.session.user._id ? true:false;
          let isJoined = await Member.find({group_id:req.params.id, user_id: req.session.user._id}).count();

          res.render('shareLink', {group: groupData, totalMembers:totalMembers, isOwner: isOwner, isJoined:isJoined});
        }
    } catch (error) {
        console.log(error.message);
    }
}

const joinGroup = async (req,res) => {
    try {

        const member = new Member({
            group_id : req.body.group_id,
            user_id : req.session.user._id
        });
        await member.save();
        res.send({success:true, msg:"Congratulation, you've joined the group successfully!"})
    } catch (error) {
        res.send({success:false, msg:error.message});
    }
}

const groupChat = async(req, res) => {
    try {
        console.log('groupChat called');
        console.log('session user:', req.session.user);

        const myGroup = await Group.find({creator_id: req.session.user._id});
        console.log('myGroup found:', myGroup.length);

        const joinedGroup = await Member.find({
            user_id: req.session.user._id
        }).populate('group_id');
        console.log('joinedGroup found:', joinedGroup.length);

        res.render('chat-group', {
            user: req.session.user,
            myGroup: myGroup,
            joinedGroup: joinedGroup
        });
    } catch(error) {
        console.log('groupChat ERROR:', error.message);
        res.send('Error: ' + error.message); // show error in browser
    }
}

const saveGroupChat = async (req,res) => {
    try {

        let chat = new GroupChat({
            sender_id:req.body.sender_id,
            group_id: req.body.group_id,
            message: req.body.message
        });

        let newChat = await chat.save();
        res.send({success:true, chat:newChat});
    } catch (error) {
        res.send({success:false, msg:error.message});   
    }
}

const loadGroupChat = async (req,res) => {
    try {
       const groupChats = await GroupChat.find({group_id:req.body.group_id});
        res.send({success:true, chats: groupChats});
    } catch (error) {
        res.send({success:false,msg:error.message});
    }
}

const deleteGroupChat = async (req,res) => {
    try {
       await GroupChat.deleteOne({_id: req.body.id});
        res.send({success:true, msg:'Chat Deleted'});
    } catch (error) {
        res.send({success:false,msg:error.message});
    }
}
const updateGroupChat = async (req,res) => {
    try {
        await GroupChat.findByIdAndUpdate({_id: req.body.id},{
            $set:{
                message:req.body.message
            }
        });
        res.send({success:true, msg:'Chat Updated'});
    } catch (error) {
        res.send({success:false,msg:error.message});
    }
}
module.exports = {
    registerLoad,
    register,
    loadLogin,
    login,
    logout,
    loadDashboard,
    saveChat,
    deleteChat,
    updateChat,
    loadGroups,
    createGroup,
    getMembers,
    addMembers,
    updateChatGroup,
    deleteChatGroup,
    shareGroup,
    joinGroup,
    groupChat,
    saveGroupChat,
    loadGroupChat,
    deleteGroupChat,
    updateGroupChat,
    refreshToken
}
