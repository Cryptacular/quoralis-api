const express = require('express');
const helmet = require('helmet')
const request = require('request');
const xml2js = require('xml2js');
const nodemailer = require('nodemailer');
const { check, validationResult } = require('express-validator/check');
const config = require('./config.json');

const app = express();

app.use(helmet());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://quoralis.com');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(express.json());

var port = config.PORT || 8080;

var router = express.Router();

router.get('/', function(req, res) {
    res.json({ message: 'Welcome to Quoralis! Please check out http://quoralis.com' });
});

router.get('/posts', function(req, res) {
    request('https://medium.com/feed/quoralis', function(error, response, body) {
        if (!error) {
            xml2js.parseString(body, function(error, result) {
                console.log('/posts called at ' + new Date());
                res.json(result.rss.channel);
            });
        } else {
            res.error(error.message);
        }
    });
});

router.post('/contact', [
    check('name')
        .isLength({ min: 1 })
        .withMessage('Name is required'),
    check('message')
        .isLength({ min: 1 })
        .withMessage('Message is required'),
    check('email')
        .isEmail()
        .withMessage('That email doesn\'t look right')
], function(req, res) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        res.send({
            status: 'Bad request',
            statusCode: 400,
            message: 'Please fill in the required fields.',
            errors: errors.array()
        });
        return;
    }
    
    const { name, email, message } = req.body;
    
    const transporter = nodemailer.createTransport({
        host: 'mail.quoralis.com',
        port: 587,
        secure: false,
        auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    
    const mailOptions = {
        from: 'info@quoralis.com',
        replyTo: `'${name}' <${email}>`,
        to: 'info@quoralis.com',
        subject: `Enquiry from ${name} - Quoralis`,
        text: `From: ${name} <${email}>\n\nMessage: ${message}`
    };
    
    transporter.sendMail(mailOptions, (error) => {
        if (error) {
            console.log(error);
            res.send({
                status: 'Internal Server Error',
                statusCode: 500,
                message: 'Unknown error. Please try again.'
            });
        } else {
            console.log(`Email sent: ${email}`);
            res.send({
                status: 'OK',
                statusCode: 200,
                message: 'Thanks! We\'ll get back to you as soon as possible.'
            });
        }
    });
});

app.use('/', router);

app.listen(port);
console.log(`Listening on port ${port}`);