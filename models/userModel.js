const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'name is required']
    },
    email: {
        type: String,
        required: [true, 'email is required and should be unique'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "password is required"],
    },
    profilePic: {
        type: String,
        default: ""
    },
    currency: {
        type: String,
        default: "INR"
    }
}, { timestamps: true });

module.exports = mongoose.model('user', userSchema);