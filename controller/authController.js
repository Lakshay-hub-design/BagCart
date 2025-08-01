const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/genrateToken');

module.exports.registerUser = async function(req, res){
    try {
        let{email, password, fullname} = req.body;
        const errors = {};

        // Validation
        if (!fullname || fullname.trim().length < 3) {
            errors.fullname = "Full name must be at least 3 characters long.";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            errors.email = "Invalid email address.";
        }

        if (!password || password.length < 6) {
            errors.password = "Password must be at least 6 characters.";
        }

        let user = await userModel.findOne({email: email});
        if(user) {
            req.flash("error", "You already have an account, please login..");
            return res.redirect("/");
        }

        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(password, salt, async function(err, hash) {
                if(err) return res.send(err.message);
                else{
                    let user = await userModel.create({
                        fullname,
                        email,
                        password: hash
                    });
                    let token = generateToken(user);
                    res.cookie("token", token)
                    res.redirect("/users/shop")
                }
            })
        })
    } catch (err){
        res.send(err.message);
    }
}

module.exports.loginUser = async function(req, res){
    let {email, password} = req.body

    let user = await userModel.findOne({email: email});
    if(!user){
        req.flash("error", "Email or Password incorrect");
        return res.redirect("/");
    }
    bcrypt.compare(password, user.password, function(err, result){
        if (result){
        let token = generateToken(user);
        res.cookie("token", token)
        res.redirect("/users/shop")
        }
        else{
            req.flash("error", "Email or Password incorrect");
            return res.redirect("/")
        }
    })
}

module.exports.logout = function(req, res){
    res.cookie("token", "")
    res.redirect("/")
}