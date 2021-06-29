const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth')
const User = require('../models/User');

router.get('/', async(req, res) => {
    const players = await User.find().sort('-mmr').limit(25);
    res.render('welcome', {
        players: players,
        user: req.user
    });
})

router.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.render('dashboard', {
        user: req.user
    });
})

module.exports = router;