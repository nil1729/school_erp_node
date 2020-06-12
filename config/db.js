const mongoose = require('mongoose');
const config = require('config');

module.exports = async () => {
    try {
        await mongoose.connect(config.get('mongoURI'), {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        });
        console.log('MongoDB connected....');
    } catch (e) {
        console.log('Refused to connect...');
        process.exit(1);
    }
};
