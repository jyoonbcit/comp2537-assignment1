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
        res.send(`
        <h1> ${err.details[0].message} </h1>
        <a href='/signup'> Try again. </a>
        `);
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
                password: newUserPassword,
                type: 'user'
            });
            await newUser.save();
            res.redirect('/login');
        } else {
            res.send(`
            <h1> Email already exists. </h1>
            <a href='/signup'> Try again. </a>
            `)
        }
    } catch (err) {
        console.log(err);
        res.send(`
        <p> Error signing up </p>
        `);
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
        res.send(`
        <h1> ${err.details[0].message} </h1>
        <a href='/login'> Try again. </a>
        `)
        return;
    };
    try {
        // set a global variable to true if the user is authenticated
        const result = await usersModel.findOne({
            email: req.body.email
        })
        console.log(result)
        if (result === null) {
            res.send(`
            <h1> Invalid email/password combination. </h1>
            <a href='/login'> Try again. </a>
            `);
        } else if (bcrypt.compareSync(req.body.password, result?.password)) {
            req.session.GLOBAL_AUTHENTICATED = true;
            req.session.loggedName = result.name;
            req.session.loggedEmail = req.body.email;
            req.session.loggedPassword = req.body.password;
            req.session.loggedType = result.type;
            var hour = 3600000;
            req.session.cookie.expires = new Date(Date.now() + (hour));
            req.session.cookie.maxAge = hour;
            res.redirect('/members');
        } else {
            res.send(`
            <h1> Invalid email/password combination. </h1>
            <a href='/login'> Try again. </a>
            `);
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

app.get('/admin', async (req, res) => {
    if (!req.session.GLOBAL_AUTHENTICATED) {
        res.redirect('/login');
        return;
    } else if (req.session.loggedType !== 'admin') {
        res.status(403).send(`
        <h1> You are not authorized to view this page. </h1>
        `);
        return;
    } else {
        const result = await usersModel.find({});
        console.log(req.session.GLOBAL_AUTHENTICATED + " " + req.session.loggedType);
        res.render('admin.ejs', {'users': result, 'authenticated_admin': req.session.GLOBAL_AUTHENTICATED && req.session.loggedType === 'admin'});
    }
});

app.post('/admin/promote', async (req, res) => {
    const user = req.body;
    try {
        const result = await usersModel.updateOne(
        {
            _id: user.id
        },
        {
            $set: {
                type: 'admin'
            }
        });
        console.log('Promoted user');
        res.redirect('/admin');
    } catch (err) {
        res.send("An error occurred.");
    }
});

app.post('/admin/demote', async (req, res) => {
    const user = req.body;
    try {
        const result = await usersModel.updateOne(
            {
                _id: user.id
            },
            {
                $set: {
                    type: 'user'
                }
            });
            res.redirect('/admin');
    } catch (err) {
        res.send("An error occurred.");
    }
});

app.get('*', function (req, res) {
    res.status(404).render('404.ejs');
});



module.exports = app;