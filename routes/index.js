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

router.get('/api/scoreboard', async(req, res) => {
    console.log('accept')
    var page = 1;
    var limit = 20;
    if (typeof req.query.page != 'undefined') page = parseInt(req.query.page);
    if (typeof req.query.limit != 'undefined') limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;

    const n_players = await User.find().countDocuments();
    const players = await User.find().sort('-mmr').skip(startIndex).limit(limit);
    console.log(n_players)
    let players_json = []

    players.forEach(player => {
        players_json.push({
            username: player.name,
            score: player.mmr
        })
    });

    res.json({
        count: n_players,
        players: players_json
    })

})

module.exports = router;