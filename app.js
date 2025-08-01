const express = require('express');
const mongoose = require('mongoose');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const flash = require('connect-flash');
require('dotenv').config();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.EXPRESS_SESSION_SECRET,
  })
);
app.use(flash());

app.get('/', function(req, res){
    let error = req.flash("error");
    res.render("index", {error, loggedin: false})
})


app.use('/users', require('./routes/userRouter'));
app.use('/owners', require('./routes/ownerRouter'));
app.use('/products', require('./routes/productsRouter'));

const PORT = process.env.PORT || 3000

mongoose.connect(process.env.MONGO_URI)
.then(()=> {
    console.log('MongoDB Conected');
    app.listen(PORT,()=> console.log(`Serverrunning on port ${PORT}`))
})
.catch((err) => console.error(err))