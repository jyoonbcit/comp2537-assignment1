const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
const usersModel = require('./models/users');
var MongoDBStore = require('connect-mongodb-session')(session);
const dotenv = require('dotenv');
dotenv.config();
app.use(express.urlencoded({ extended: false }))
// TODO: update URI and collection name
var dbStore = new MongoDBStore({
    uri: 'mongodb://127.0.0.1:27017/sample',
    collection: 'sample'
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
        <br>
        <button onclick="window.location.href='/login'">Log in</button>
        `)
    } else {
        res.send(`
        <p> Hello, ${req.session.loggedName}! </p>
        <button onclick="window.location.href='/members'">Go to Members Area</button>
        <button onclick="window.location.href='/logout'">Logout</button>
        `)
    }
});

app.get('/signup', (req, res) => {
    res.send(`
    <form action='/signup' method='post'>
        <input type='text' name='name' placeholder='Enter your name' />
        <input type='text' name='email' placeholder='Enter your email' />
        <input type='text' name='password' placeholder='Enter your password' />
        <input type='submit' value='Sign up' />
    </form>
    `)
});

app.get('/login', (req, res) => {
    res.send(`
    <form action='/login' method='post'>
        <input type='text' name='email' placeholder='Enter your email' />
        <input type='text' name='password' placeholder='Enter your password' />
        <input type='submit' value='Login' />
    </form>
    `)
});

app.post('/login', async (req, res) => {
    try {
        // set a global variable to true if the user is authenticated
        const result = await usersModel.findOne({
            email: req.body.email
        })
        console.log(result)
        if (result === null) {
            res.send(`
            <h1> No such email exists. </h1>
            `)
        } else if (bcrypt.compareSync(req.body.password, result?.password)) {
            req.session.GLOBAL_AUTHENTICATED = true;
            req.session.loggedName = req.body.name;
            req.session.loggedEmail = req.body.email;
            req.session.loggedPassword = req.body.password;
            res.redirect('/');
        } else {
            res.send(`
            <h1> Wrong password. </h1>
            `)
        }
    } catch (err) {
        console.log(err);
    }
});



// TODO: why is this needed?
module.exports = app;