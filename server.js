if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const express = require('express');
const app = express();
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const connectDB = require('./config/db');

// Database Connect
connectDB();

// Body Parser Setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// view engine Setup
app.set('view engine', 'ejs');

// Session Setup
app.use(
	session({
		resave: false,
		saveUninitialized: false,
		secret: process.env.SESSION_SECRET,
	})
);

// Passport Setup
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// Flash Setup
app.use(flash());
app.use((req, res, next) => {
	res.locals.success = req.flash('success');
	res.locals.error = req.flash('error');
	next();
});

// Routes
app.get('/', (req, res) => {
	res.render('auths/login');
});
app.use('/auth', require('./routes/auths'));
app.use('/admin', require('./routes/admin'));

// PORT for Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, process.env.IP, () => {
	console.log(`Server started on port ${PORT}`);
});
