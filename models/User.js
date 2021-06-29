const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
        min: 3
    },
    lowercase_name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    main_char: {
        type: String
    },
    steam_profile: {
        type: String
    },
    mmr: {
        type: Number,
        default: 1000
    },
    description: {
        type: String,
        max: 1000
    },

    match_history: {
        total: {
            type: Number,
            default: 0
        },
        won: {
            type: Number,
            default: 0
        },
        lost: {
            type: Number,
            default: 0
        },
        declined: {
            type: Number,
            default: 0
        },
        declined_streak: {
            type: Number,
            default: 0
        }
    },

    date: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;