const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/genrateToken");
const userModel = require('../models/userModel')

module.exports.registerowner =  async function (req, res) {
    try {
      let exesting = await userModel.findOne({role: 'owner'});
      if (exesting) {
        req.flash("error", "Owner already exists")
        return res.redirect('/')
      }
      let { fullname, email, password } = req.body;
      bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async function (err, hash) {
          let user = await userModel.create({
            fullname,
            email,
            password: hash,
            role: 'owner'
          });
          let token = generateToken(user);
          res.cookie("ownertoken", token);
          res.send(user)
        });
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Something went wrong.");
    }
};

module.exports.loginowner = async function(req,res){
    let {email, password} = req.body
    let user = await userModel.findOne({email: email})
    if(!user || user.role !== 'owner'){
      console.log("Owner not found or wrong role");
        req.flash("error", "Invalid owner credentials");
        return res.redirect("/")
    }
    bcrypt.compare(password, user.password, function(err, result){
        if(result){
          console.log("Owner login success ✅");
            let token = generateToken(user);
            res.cookie("ownertoken", token);
            res.redirect("/owners/admin")
        }else{
            req.flash("error", "Email or Password incorrect");
            return res.redirect("/")
        }
    })
};

module.exports.logout =  function(req, res){
    res.cookie("ownertoken", "")
    res.redirect("/?owner=1")
}