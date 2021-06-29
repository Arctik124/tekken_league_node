const mongoose = require('mongoose');
const BattleSchema = new mongoose.Schema({
    player1: {
        type: String,
        require: true
    },
    player2: {
        type: String,
        require: true
    },
    max_score: {
        type: Number,
        require: true
    },
    score1: {
        type: Number,
        default: 0
    },
    score2: {
        type: Number,
        default: 0
    },
    delta: {
        type: Number,
        default: 0
    },
    winner: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    },
    accepted: {
        type: Boolean,
        default: false
    },
    player_to_confirm: {
        type: String,
    },
    score_confirmed: {
        type: Boolean,
        default: false
    },
    confirmation_sent: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Battle = mongoose.model('Battle', BattleSchema);

module.exports = Battle;