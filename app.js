const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;
var MongoDBStore = require('connect-mongodb-session')(session);
const dotenv = require('dotenv');
dotenv.config();
// TODO: update URI and collection name
var dbStore = new MongoDBStore({
    uri: process.env.MONGODB_URI,
    collection: 'mySessions'
});
// TODO: learn how this works
// Session storage setup
app.use(session({
    secret: '1234',
    store: dbStore,
    resave: false,
    saveUninitialized: false
}));

app.get('/', (req, res) => {
    if (!req.session.GLOBAL_AUTHENTICATED) {
        res.send(`
        <button onclick="window.location.href='/signup'">Sign up</button>
        <button onclick="window.location.href='/login'">Log in</button>
        `)
    } else {
        res.send(`
        <p> Hello, ${req.session.name}! </p>
        <button onclick="window.location.href='/members'">Go to Members Area</button>
        <button onclick="window.location.href='/logout'">Logout</button>
        `)
    }
});

app.get('/signup', (req, res) => {
    res.send(`
    <form action='/signup' method='post'>
        <input type='text' name='username' placeholder='Enter your name' />
        <input type='text' name='password' placeholder='Enter your password' />
        <input type='submit' value='Sign up' />
    </form>
    `)
});

app.get('/login', (req, res) => {
    res.send(`
    <form action='/login' method='post'>
        <input type='text' name='username' placeholder='Enter your name' />
        <input type='text' name='password' placeholder='Enter your password' />
        <input type='submit' value='Login' />
    </form>
    `)
});