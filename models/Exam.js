const mongoose = require('mongoose');
const examSchema = mongoose.Schema({
    classes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class"
        }
    ],
    subjects:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject"
        }
    ],
    title:{
        type: String,
        required: true
    },
    startDate:{
        type: Date,
        required: true
    },
    date: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Exam", examSchema);