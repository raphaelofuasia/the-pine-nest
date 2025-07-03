const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

const SECRET_KEY = 'your-secret-key';
const ADMIN_CREDENTIALS = { username: 'admin', password: 'securepassword123' };
const EMAIL_USER = 'your-email@example.com';
const EMAIL_PASS = 'your-email-password';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

let blogPosts = [];

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

app.post('/api/blog', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, SECRET_KEY, (err) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        const { title, content } = req.body;
        const post = { title, content, date: new Date().toISOString() };
        blogPosts.push(post);
        res.json(post);
    });
});

app.get('/api/blog', (req, res) => {
    res.json(blogPosts);
});

app.get('/api/blog/:date', (req, res) => {
    const post = blogPosts.find(p => p.date === req.params.date);
    if (post) {
        res.json(post);
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
});

app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    const mailOptions = { from: EMAIL_USER, to: 'info@pinene.st', subject: `Contact Form Submission from ${name}`, text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}` };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.status(500).json({ message: 'Error sending email' });
        } else {
            console.log('Email sent: ' + info.response);
            res.json({ message: 'Email sent successfully' });
        }
    });
});

app.get('/services/:service', (req, res) => {
    const serviceFile = path.join(__dirname, 'public', 'services', `${req.params.service}.html`);
    res.sendFile(serviceFile, (err) => {
        if (err) res.status(404).send('Service not found');
    });
});

app.get('/blog/:date', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Update to serve blog.html if created
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});