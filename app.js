const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const dotenv = require('dotenv');
dotenv.config({ path: './env/.env' });

app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

const bcryptjs = require('bcryptjs');

const session = require('express-session')
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))

const connection = require('./database/db');

//rutas
app.get('/', (req, res) => {
    res.render('index');
})

app.get('/login', (req, res) => {
    res.render('login');
})

app.get('/register', (req, res) => {
    res.render('register');
})

//registro
app.post('/register', async (req, res) => {
    const name = req.body.name;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHash = await bcryptjs.hash(pass, 10);
    connection.query('INSERT INTO user SET ?', { name: name, lastname: lastname, email: email, user: user, pass: passwordHash }, async (error, results) => {
        if (error) {
            console.log(error);
        } else {
            res.redirect('register', {
                alert: true,
                alertTitle: "Registro",
                alertMessage: "Registro Exitoso!",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: ' '
            })
        }
    })
})

//autenticacion 
app.post('/auth', async (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHash = await bcryptjs.hash(pass, 8);
    if (user && pass) {
        connection.query('SELECT * FROM user WHERE user = ?', [user], async (error, results) => {
            if (results.length == 0 || !(await bcryptjs.compare(pass, results[0].pass))) {
                res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Los datos ingresados no son correctos",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: false,
                    ruta:'login'
                });
            } else {
                req.session.loggedin = true;
                req.session.name = results[0].name;
                res.render('login', {
                    alert: true,
                    alertTitle: "Login",
                    alertMessage: "Inicio de sesion correcto",
                    alertIcon: 'success',
                    showConfirmButton: false,
                    timer: 1500,
                    ruta: ' '
                })
            }
        })
    } else {
        res.render('login', {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Complete los campos vacios",
            alertIcon: "error",
            showConfirmButton: true,
            timer: false,
            ruta:'login'
        });
    }
})

app.get('/profile', (req, res)=>{
    if(req.session.loggedin){
        res.render('profile', {
            login: true,
            name: req.session.name
        });
    }else{
        res.render('profile', {
            login: false,
            name: 'Debes iniciar sesion'
        });
    }
})

app.get('/logout', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/')
    })
})

app.listen(3000, (req, res) => {
    console.log('SERVER RUNNING IN http://localhost:3000');
})