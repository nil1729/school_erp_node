const mongoose = require('mongoose');
const subjectSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    class_ID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class"
    },
    className:{
        type: String
    },
    teachers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    code:{
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Subject", subjectSchema);