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
    uri: process.env.MONGODB_CONNECTION_STRING,
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
        console.log(req.session);
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

// TODO: use JOI to prevent NoSQL injection attacks
app.post('/signup', async (req, res) => {
    try {
        const result = await usersModel.findOne({
            email: req.body.email
        })
        if (result === null && req.body.name && req.body.email && req.body.password) {
            const newUserPassword = bcrypt.hashSync(req.body.password, 10);
            const newUser = new usersModel({
                name: req.body.name,
                email: req.body.email,
                password: newUserPassword
            });
            console.log('Registered successfully.');
            await newUser.save();
            res.redirect('/login');
        } else if (!req.body.name) {
            res.send(`
            <h1> Name is required. </h1>
            <a href='/signup'"> Try again. </a>
            `)
        } else if (!req.body.email) {
            res.send(`
            <h1> Email is required. </h1>
            <a href='/signup'"> Try again. </a>
            `)
        } else if (!req.body.password) {
            res.send(`
            <h1> Password is required. </h1>
            <a href='/signup'"> Try again. </a>
            `)
        } else {
            res.send(`
            <h1> Email already exists. </h1>
            <a href='/signup'"> Try again. </a>
            `);
        }
    } catch (err) {
        console.log(err);
        res.send('Error signing up');
    }
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
            <h1> Invalid email/password combination. </h1>
            <a href='/login'"> Try again. </a>
            `)
        } else if (bcrypt.compareSync(req.body.password, result?.password)) {
            req.session.GLOBAL_AUTHENTICATED = true;
            req.session.loggedName = result.name;
            req.session.loggedEmail = req.body.email;
            req.session.loggedPassword = req.body.password;
            res.redirect('/');
        } else {
            res.send(`
            <h1> Invalid email/password combination. </h1>
            <a href='/login'"> Try again. </a>
            `)
        }
    } catch (err) {
        console.log(err);
    }
});

app.use(express.static('public'));
app.get('/members', (req, res) => {
    if (req.session.GLOBAL_AUTHENTICATED) {
        const randomImageNumber = Math.floor(Math.random() * 3) + 1;
        res.send(`
        <h1> Hello ${req.session.loggedName}! </h1>
        <img src='00${randomImageNumber}.png' width=300px />
        <br>
        <button onclick="window.location.href='/logout'">Logout</button>
        `);
    } else {
        res.redirect('/');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('*', function (req, res) {
    res.status(404).send(`
    <p> Page not found - 404 </p>
    `);
});



// TODO: why is this needed?
module.exports = app;