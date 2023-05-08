const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
const usersModel = require('./models/users');
var MongoDBStore = require('connect-mongodb-session')(session);
const dotenv = require('dotenv');
dotenv.config();
const Joi = require('joi');
// const validationResult = schema.validate(req.body);
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
// For testing purposes (joi)
// app.use(express.json());
var dbStore = new MongoDBStore({
    uri: process.env.MONGODB_CONNECTION_STRING,
    collection: 'sessions'
});
// Session storage setup
app.use(session({
    secret: process.env.MONGODB_SESSION_SECRET,
    store: dbStore,
    resave: false,
    saveUninitialized: false,
    expires: new Date(Date.now() + 3600000)
}));

app.get('/', (req, res) => {
    res.render('index.ejs', { 
        'name': req.session.loggedName, 
        'authenticated': req.session.GLOBAL_AUTHENTICATED 
    });
});

app.get('/signup', (req, res) => {
    res.render('signup.ejs');
});

app.post('/signup', async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().regex(/^[\w\-\s]+$/).max(20).required(),
            email: Joi.string().email().required(),
            password: Joi.string().max(20).required()
        });
        const validationResult = await schema.validateAsync({ name: req.body.name, email: req.body.email, password: req.body.password });
    } catch (err) {
        res.render('signup/signup_regex.ejs', { 'error': err.details[0].message });
        return;
    };
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
            await newUser.save();
            res.redirect('/login');
        } else {
            res.render('signup/signup_existing_email.ejs');
        }
    } catch (err) {
        console.log(err);
        res.render('signup/signup_error.ejs');
    }
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.post('/login', async (req, res) => {
    try {
        const schema = Joi.object({
                email: Joi.string().email().required(),
                password: Joi.string().max(20).required()
            });
        console.log("Returns: " + req.body.password);
        const validationResult = await schema.validateAsync({ email: req.body.email, password: req.body.password });
    } catch (err) {
        console.log(err);
        res.render('login/login_regex.ejs', { 'error': err.details[0].message });
        return;
    };
    try {
        // set a global variable to true if the user is authenticated
        const result = await usersModel.findOne({
            email: req.body.email
        })
        console.log(result)
        if (result === null) {
            res.render('login/login_error.ejs');
        } else if (bcrypt.compareSync(req.body.password, result?.password)) {
            req.session.GLOBAL_AUTHENTICATED = true;
            req.session.loggedName = result.name;
            req.session.loggedEmail = req.body.email;
            req.session.loggedPassword = req.body.password;
            var hour = 3600000;
            req.session.cookie.expires = new Date(Date.now() + (hour));
            req.session.cookie.maxAge = hour;
            res.redirect('/members');
        } else {
            res.render('login/login_error.ejs');
        }
    } catch (err) {
        console.log(err);
    }
});

app.use(express.static('public'));
app.get('/members', (req, res) => {
    if (req.session.GLOBAL_AUTHENTICATED) {
        const randomImageNumber = Math.floor(Math.random() * 3) + 1;
        res.render('members.ejs', { 'name': req.session.loggedName, 'image': randomImageNumber })
    } else {
        res.redirect('/');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/admin', (req, res) => {
    res.render('admin.ejs');
});

app.get('*', function (req, res) {
    res.status(404).render('404.ejs')
});



module.exports = app;