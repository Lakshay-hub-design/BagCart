const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

async function isOwner(req, res, next) {
  try {
    const token = req.cookies.ownertoken;
    if (!token) return res.redirect("/");

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== "owner") {
      return res.status(403).send("Access Denied");
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).send("Invalid Token");
  }
}


module.exports = isOwner;