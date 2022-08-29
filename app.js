//dependencies
const express = require('express');
const app = express();
const { MongoClient } = require('mongodb')
const env = require('dotenv').config()
const uri = process.env.URI
const mongoclient = new MongoClient(uri, { useUnifiedTopology: true });
app.use(express.urlencoded({ extended: false }));
const session = require('express-session')
const MongoDBSession = require("connect-mongodb-session")(session)
//cookie stuff
const store = new MongoDBSession({
    uri: uri,
    collection: 'mySessions'
})
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: store
}))

mongoclient.connect(async function (err, mongoclient) {
    console.log("Successfully connected to mongodb!");

    global.mongoclient = mongoclient;

    let port = 3000;
    app.set('port', port);

    app.set('view engine', 'ejs');
    app.use(express.static('static'));

    require('./router')(app);

    app.listen(port, () => console.info(`Listening on port ${port}`));
})
