const mongoose = require('mongoose');
const userSchema = mongoose.Schema({
    role: {
        type: String,
        required: true,
        default: 'teacher'
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        required: true,
        type: String,
        default: '$2b$10$H87a2FQLV8QBDpwiXpzB7uPL6FPMlwv6miwMLd8ADZnIWGwKA0NLi',
    },
    address:{
        type: String,
        required: true,
    },
    phone:{
        type: Number,
        required: true
    },
    instructor:{
        type: String,
        required: true
    },
    subject:{
        type: String,
        required: true
    },
    qualification:{
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now()
    }
});

module.exports = mongoose.model("User", userSchema);