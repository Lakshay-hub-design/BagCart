const express = require("express");
const router = express.Router();
const isOwner = require('../middleware/isOwner')
const ownerController = require('../controller/ownerController')
const productModel = require('../models/productModel')
const userModel = require('../models/userModel')

// router.post("/register", ownerController.registerowner);

router.post('/login', ownerController.loginowner)
router.get("/logout", ownerController.logout);

router.get("/admin", isOwner, async function (req, res) {
  const { search, sortBy } = req.query;

  let filter = {};
  if (search) {
    filter.name = new RegExp(search, "i");
  }

  let sortOptions = {};
  if (sortBy === "price-asc") sortOptions.price = 1;
  else if (sortBy === "price-desc") sortOptions.price = -1;

  const products = await productModel.find(filter).sort(sortOptions);

  // ✅ Convert image from Binary to Buffer
  const updatedProducts = products.map(product => {
    if (product.image && product.image.buffer) {
      product.image = Buffer.from(product.image.buffer);
    }
    return product;
  });

  res.render("admin", { products: updatedProducts, loggedin: false });
});


router.get("/create",isOwner, async function (req, res) {
      let success = req.flash("success");
      res.render("createProducts", {success, loggedin: false });
});


router.get("/analytics/users", isOwner, async (req, res) => {
  const users = await userModel.find();

  const totalUsers = users.length;

  const mostActive = users
    .filter(u => u.cart.length > 0)
    .sort((a, b) => b.cart.length - a.cart.length)
    .slice(0, 5);

  const emptyCarts = users.filter(user => !user.cart || user.cart.length === 0);;

  const recentUsers = users
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  res.render("analytics-users", {
    totalUsers,
    mostActive,
    emptyCarts,
    recentUsers,
    loggedin: false
  });
});

router.get("/editproduct/:id", isOwner, async function(req, res){
    const product = await productModel.findById(req.params.id)
    res.render("productedit", {product, loggedin: false})
})

router.post("/editproduct/:id", isOwner, async function (req, res) {
    let {name, price, discount} = req.body
    const product = await productModel.findByIdAndUpdate(req.params.id, {name, price, discount})
    res.redirect("/owners/admin")
})

router.post("/delete/:id", isOwner, async function(req, res){
  const product = await productModel.findByIdAndDelete(req.params.id)
  res.redirect("/owners/admin")
})

module.exports = router;