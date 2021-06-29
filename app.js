const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
require("dotenv/config")
require('./config/passport')(passport)

const app = express();
app.use(express.static(__dirname));

// fav.ico

var favicon = require('serve-favicon');
app.use(favicon(__dirname + '/favicon.ico'));
//EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});


//Rooutes
app.use('/', require('./routes/index'));
app.use('/user', require('./routes/user'));
app.use('/battle', require('./routes/battle'));


//DB connect
mongoose.connect(
        process.env.DB_CONNECTION, { useUnifiedTopology: true, useNewUrlParser: true })
    .then(() => { console.log('Connected to DB') })
    .catch((err) => { console.log(err) });

const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));