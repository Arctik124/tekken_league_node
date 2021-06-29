const { Mongoose } = require('mongoose');
const express = require('express');
const passport = require('passport');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const User = require('../models/User');
const Battle = require('../models/Battle');
const { ensureAuthenticated } = require('../config/auth');

router.get('/login', (req, res) => {
    res.render('login');
})


router.get('/register', (req, res) => {
    if (typeof req.user === 'undefined') {
        res.render('register');
    } else {
        req.flash('error_msg', 'You already logged in!');
        res.redirect('/user');
    }
})

router.post('/register', (req, res) => {
    const { name, email, main_char, steam_profile, description, password, password2 } = req.body;
    let errors = [];

    //Chech required fields
    if (!name || !email || !password || !password2) errors.push({ msg: "Please fill in all required fields" })

    if (email.trim().match(/.+@.+[.].+/) != email) errors.push({ msg: "Email is invalid" })


    //Check passwords match
    if (password2.trim() != password.trim()) errors.push({ msg: "Passwords do not match" })


    if (password.trim().length < 6) errors.push({ msg: "Password is too short" })

    if (errors.length > 0) {
        res.render('register', {
            errors,
            name,
            email,
            main_char,
            steam_profile,
            description,
            password,
            password2
        });
    } else {
        User.findOne({
            lowercase_name: name.trim().toLowerCase()
        }).then(async user => {
            if (user) {
                errors.push({ msg: "User with this name already exists" });
                res.render('register', {
                    errors,
                    name,
                    email,
                    main_char,
                    steam_profile,
                    description,
                    password,
                    password2
                });
            }
        });
        User.findOne({ email: email.trim() }).then(async user => {
            if (user) {
                errors.push({ msg: "User with this email already exists" });
                res.render('register', {
                    errors,
                    name,
                    email,
                    main_char,
                    steam_profile,
                    description,
                    password,
                    password2
                });
            } else {
                const newUser = new User({
                    name: name.trim(),
                    lowercase_name: name.trim().toLowerCase(),
                    email: email.trim(),
                    main_char: main_char.trim(),
                    steam_profile: steam_profile.trim(),

                    description: description.trim(),
                    password
                });

                const hashedPass = await bcrypt.hash(password.trim(), 10);
                newUser.password = hashedPass;
                newUser.save()
                    .then(user => {
                        req.flash('success_msg', 'You are now registered and can log in');
                        res.redirect('/user/login');
                    })
                    .catch(err => console.log(err));

            }

        })
    }
})

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/user',
        failureRedirect: '/user/login',
        failureFlash: true
    })(req, res, next);
})

router.get('/logout', (req, res) => {
    req.logOut();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/user/login');

})

router.get('/edit', ensureAuthenticated, async(req, res) => {

    var chars = await JSON.parse(fs.readFileSync('./public/json/character_list.json', 'utf8'));

    res.render('edit_user', {
        user: req.user,
        chars: chars.chars
    })
})

router.post('/edit', ensureAuthenticated, async(req, res) => {
    const { main_char, steam_profile, description, password, password2 } = req.body;
    let errors = [];

    const user = await User.findOne({ name: req.user.name })

    //Check passwords match
    if (password != '') {
        if (password2 != password) errors.push({ msg: "Passwords do not match" })
        if (password.length < 6) errors.push({ msg: "Password is too short" })
        console.log(errors)
        if (errors.length > 0) {
            var chars = await JSON.parse(fs.readFileSync('./public/json/character_list.json', 'utf8'));
            res.render('edit_user', {
                errors,
                user: user,
                steam_profile,
                description,
                password,
                password2,
                chars: chars.chars,
                main_char
            });
        } else {
            const hashedPass = await bcrypt.hash(password, 10);
            user.password = hashedPass;
        }
    }
    if (description != '') {
        user.description = description;
    }
    if (main_char != '') {
        user.main_char = main_char;
    }
    if (steam_profile != '') {
        user.steam_profile = steam_profile;
    }
    await user.save();
    req.flash('success_msg', 'Updated successfully');
    res.redirect('/user')
});

router.get('/', ensureAuthenticated, async(req, res) => {
    try {
        const user = req.user;
        var obj = await JSON.parse(fs.readFileSync('./public/json/characters_img.json', 'utf8'));

        var page = 1;
        var limit = 10;
        if (typeof req.query.page != 'undefined') page = parseInt(req.query.page);
        if (typeof req.query.limit != 'undefined') limit = parseInt(req.query.limit);

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const n_battle = await Battle.find({ $or: [{ player1: user.name }, { player2: user.name }] }).countDocuments;
        const battles = await Battle.find({ $or: [{ player1: user.name }, { player2: user.name }] }).sort('-date').skip(startIndex).limit(limit);


        const img_link = obj[user.main_char.split(' ')[0]];
        const own = req.user === user;

        if (user != null)
            res.render('profile', {
                user_profile: user,
                img_link: img_link,
                battles: battles,
                n_battle: n_battle,
                pages: Math.ceil(n_battle / limit),
                page: page,
                own: own
            });
        else
            res.status(404).redirect('/user');
    } catch (error) {
        console.log(error)
        res.render('profile', { msg: error });
    }
})

router.get('/:name', async(req, res) => {
    try {
        if (typeof req.user != 'undefined') {
            if (req.user.lowercase_name === req.params.name.toLowerCase()) res.redirect('/user');
        }
        const user = await User.findOne({ lowercase_name: req.params.name.toLowerCase() });
        var images = await JSON.parse(fs.readFileSync('./public/json/characters_img.json', 'utf8'));


        const img_link = images[user.main_char.split(' ')[0]];

        var page = 1;
        var limit = 10;
        if (typeof req.query.page != 'undefined') page = parseInt(req.query.page);

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const n_battle = await Battle.find({ $or: [{ player1: user.name }, { player2: user.name }] }).countDocuments;
        const battles = await Battle.find({ $or: [{ player1: user.name }, { player2: user.name }] }).sort('-date').skip(startIndex).limit(limit);


        const own = req.user === user;
        if (user != null)
            res.render('profile', {
                user_profile: user,
                img_link: img_link,
                battles: battles,
                n_battle: n_battle,
                pages: Math.ceil(n_battle / limit),
                page: page,
                own: own,
            });
        else
            res.status(404).redirect('/user');
    } catch (error) {
        console.log(error)
        res.render('profile', { msg: error });
    }

})



module.exports = router;