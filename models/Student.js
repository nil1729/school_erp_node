const mongoose = require('mongoose');
const studentSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName:{
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true,
    },
    guardian: {
        required: true,
        type: String
    },
    phone:{
        type: Number,
        required: true,
    },
    class:{
        type: String,
        required: true
    },
    school_ID:{
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now()
    }
});

module.exports = mongoose.model("Student", studentSchema);