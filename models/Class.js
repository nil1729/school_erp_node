const mongoose = require('mongoose');
const classSchema = mongoose.Schema({
    className:{
        type: String,
        required: true,
        unique: true,
    },
    classRoomNo:{
        type: Number,
        required: true
    },
    teacherInCharge:{
        type: String,
        required: true,
        default: 'admin'
    },
    students:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student' 
        }
    ],
    location:{
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now()
    }
});

module.exports = mongoose.model("Class", classSchema);