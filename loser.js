const mongoose = require('mongoose');
const User = require('./models/User');
const Battle = require('./models/Battle');
require("dotenv/config")


//DB connect
mongoose.connect(
        process.env.DB_CONNECTION, { useUnifiedTopology: true })
    .then(() => { console.log('Connected to DB') })
    .catch((err) => { console.log(err) });

var users = User.find({}).then(users => {
    users.forEach(async user => {
        const battles = await Battle.find({ $or: [{ player1: user.name }, { player2: user.name }] }).sort('-date');
        user.match_history.total = battles.length;

        console.log(`${user.name} : ${user.match_history.total}`)
            // await user.save()

    });
})