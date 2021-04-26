const mongoose = require('mongoose');

module.exports = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI, {
			useCreateIndex: true,
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
		});
		console.log('MongoDB connected....');
	} catch (e) {
		console.log('Refused to connect...');
		process.exit(1);
	}
};
