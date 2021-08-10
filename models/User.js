const mongoose = require('mongoose');
const userSchema = mongoose.Schema(
	{
		role: {
			type: String,
			required: true,
			enum: ['teacher', 'admin', 'student'],
		},
		name: {
			type: String,
			required: [true, 'Please add a name'],
			match: [/^[A-Za-z\s]+$/, 'Only alphabetic characters are allowed'],
			trim: true,
			maxlength: [35, 'Please choose a name which has at most 35 characters'],
		},
		email: {
			type: String,
			match: [
				/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
				'Please provide a valid email address',
			],
			unique: true,
			required: [true, 'Please provide a email address'],
		},
		password: {
			type: String,
			required: [true, 'Please add a password'],
			select: false,
			minlength: [6, 'Please add a password which has at least 6 characters'],
		},
		resetPasswordExpire: {
			type: Date,
			select: false,
		},
		resetPasswordToken: {
			type: String,
			select: false,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
