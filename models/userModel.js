const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {          // changed from username → name to match controller
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    image: {
        type: String,   // add this — stores the image path
        default: ''
    },
    is_online: {
        type: String,
        default: '0'
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);