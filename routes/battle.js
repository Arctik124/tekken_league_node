const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth')
const User = require('../models/User');
const Battle = require('../models/Battle');

router.get('/', ensureAuthenticated, async(req, res) => {
    try {
        var player2 = await User.find({}, 'name')
    } catch (error) {
        errors.push({ msg: error });
    }
    for (var i = 0; i < player2.length; i++) {
        if (player2[i].name === req.user.name) {
            player2.splice(i, 1);
        }
    }
    res.render('battle/battle_create', {
        user: req.user,
        player2: player2
    });
})

router.post('/:id/accept', ensureAuthenticated, async(req, res) => {
    const accept = req.body.accept;
    const battle = await Battle.findById(req.params.id)
    const player1 = await User.findOne({ name: battle.player1 });
    const player2 = await User.findOne({ name: battle.player2 });

    if (accept === 'true') {
        battle.accepted = true;
        player2.match_history.declined_streak = 0;
    } else {
        battle.active = false
        player1.match_history.total = player1.match_history.total - 1
        player2.match_history.total = player2.match_history.total - 1
        player2.match_history.declined = player2.match_history.declined + 1

        player2.match_history.declined_streak = player2.match_history.declined_streak + 1

        if (player2.match_history.declined_streak >= 3) {
            player2.match_history.declined_streak = 0;
            player2.mmr = player2.mmr - 20;
        }

    }
    await player1.save()
    await player2.save()
    await battle.save()
    res.send(battle)
});

router.post('/:id/score', ensureAuthenticated, async(req, res) => {
    const accept = req.body.accept;
    const battle = await Battle.findById(req.params.id)
    if (accept === 'true') {
        battle.score_confirmed = true;
        battle.active = false;



        if (battle.score1 > battle.score2) {
            battle.winner = battle.player1
            await User.updateOne({ name: battle.player1 }, { $inc: { "match_history.won": 1 } })
            await User.updateOne({ name: battle.player2 }, { $inc: { "match_history.lost": 1 } })
        } else {
            battle.winner = battle.player2
            await User.updateOne({ name: battle.player2 }, { $inc: { "match_history.won": 1 } })
            await User.updateOne({ name: battle.player1 }, { $inc: { "match_history.lost": 1 } })
        }

        const delta = change_mmr(battle.score1, battle.score2)
        battle.delta = delta;

        const player1 = await User.findOne({ name: battle.player1 });
        const player2 = await User.findOne({ name: battle.player2 });

        player1.mmr = player1.mmr + delta
        player2.mmr = player2.mmr - delta

        await player1.save()
        await player2.save()

    } else {
        battle.active = false
    }
    await battle.save()
    res.send(battle)
});

router.post('/', ensureAuthenticated, async(req, res) => {
    const player1 = req.user.name;
    var { player2, max_score } = req.body;
    let errors = [];

    if (player1 === player2) errors.push({ msg: "Player1 and player2 are identical" });

    if (max_score < 3) errors.push({ msg: "Minimum set is first to 3" });

    if (max_score > 10) errors.push({ msg: "Maximum set is first to 10" });

    if (errors.length > 0) {
        try {
            player2 = await User.find({}, 'name')
        } catch (error) {
            errors.push({ msg: error });
        }
        for (var i = 0; i < player2.length; i++) {
            if (player2[i].name === req.user.name) {
                player2.splice(i, 1);
            }
        }
        res.render('battle/battle_create', {
            errors,
            user: req.user,
            player1,
            player2,
            max_score
        });

    } else {
        const newBattle = new Battle({
            player1,
            player2,
            max_score
        });

        await User.updateOne({ name: player1 }, { $inc: { "match_history.total": 1 } })
        await User.updateOne({ name: player2 }, { $inc: { "match_history.total": 1 } })

        newBattle.save()
            .then(user => {
                req.flash('success_msg', 'Match has been created!');
                res.redirect('/battle/' + newBattle.id);
            })
            .catch(err => console.log(err));
    }
});

router.get('/:id', async(req, res) => {

    let errors = [];
    try {
        const battle = await Battle.findById(req.params.id);
        var container = { battle: battle }
        if (typeof req.user != 'undefined') {
            container.own = battle.player1 === req.user.name || battle.player2 === req.user.name;
            container.user = req.user
        } else {
            container.own = false;
        }
    } catch (error) {
        errors.push({ msg: error });
    }
    container.errors = errors
    res.render('battle/battle_detail', container);
})

router.post('/:id', async(req, res) => {
    const score1 = parseInt(req.body.score1);
    const score2 = parseInt(req.body.score2);
    let errors = [];
    var container = {};
    try {
        const battle = await Battle.findById(req.params.id);
        const max_score = battle.max_score;
        const invalid = (score1 > max_score || score2 > max_score) || (score1 === max_score && score2 === max_score) || score1 < 0 || score2 < 0;
        const send_confirm = (score1 === max_score || score2 === max_score) && !invalid;
        var player_to_confirm = ''
        if (req.user.name === battle.player1)
            player_to_confirm = battle.player2
        else
            player_to_confirm = battle.player1

        if (typeof req.user != 'undefined') {
            container.own = battle.player1 === req.user.name || battle.player2 === req.user.name;
            container.user = req.user
        } else {
            container.own = false;
        }

        if (invalid) {
            errors.push({ msg: "Invalid score" });
            req.flash('error_msg', 'Invalid score');
            container.battle = battle;
        } else {
            try {
                if (send_confirm) {
                    const battle = await Battle.updateOne({ _id: req.params.id }, {
                        $set: {
                            score1: req.body.score1,
                            score2: req.body.score2,
                            player_to_confirm: player_to_confirm,
                            confirmation_sent: true
                        }
                    });
                } else {
                    const battle = await Battle.updateOne({ _id: req.params.id }, {
                        $set: {
                            score1: req.body.score1,
                            score2: req.body.score2,
                        }
                    });
                }
                container.battle = battle;
            } catch (error) {
                errors.push({ msg: error });
            }
        }
        container.errors = errors;

        req.flash('success_msg', 'Score saved');
        res.redirect(req.params.id);

    } catch (error) {
        errors.push({ msg: error });

        container.errors = errors;
        res.render('battle/battle_detail', container);
    }


})

function change_mmr(score1, score2) {

    // # typical win/lose k1
    const std_delta = 15
    var k1 = 1
    const winner = score1 - score2 > 0
    if (!winner) {
        k1 = -k1
    }

    // # ft length factor k3
    const ft_max = 10
    const ft_min = 3
    const ft_len = Math.max(score1, score2)
    const k3 = 1 + (ft_len - ft_min) / (ft_max - ft_min) / 10

    // # mmr difference factor k4
    const score_dif = Math.abs(score1 - score2)
    var k4 = 0
    if (score_dif > 2)
        k4 = 1 + score_dif / (ft_len * 4)
    else
        k4 = 1

    const delta = Math.round(std_delta * k1 * k4 * k3)

    return delta
}

module.exports = router;