const mongoose = require('mongoose');

const classSchema = mongoose.Schema(
	{
		className: {
			type: String,
			required: true,
		},
		classRoomNo: {
			type: Number,
			required: true,
		},
		teacherInCharge: {
			type: String,
			required: true,
			default: 'admin',
		},
		classCode: {
			type: String,
			required: true,
			unique: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);
