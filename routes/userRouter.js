const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logout } = require('../controller/authController');
const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const isLoggedIn = require('../middleware/isLoggedin')
const upload = require('../config/multerConfig')
const path = require('path');
const fs = require('fs');

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get("/logout", logout)

router.get("/shop", isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({ email: req.user.email })


  let sortBy = req.query.sort || "popular";
  let filterBy = req.query.filter || "all";
  let searchQuery = req.query.search || "";

  let filterQuery = {};
  let sortQuery = {};

  // Filtering
  if (filterBy === "new") {
    filterQuery.isNew = true;
  } else if (filterBy === "discounted") {
    filterQuery.discount = { $gt: 0 };
  }

  // Search
  if (searchQuery) {
    filterQuery.name = { $regex: searchQuery, $options: "i" };
  }

  // Sorting
  if (sortBy === "lowtohigh") {
    sortQuery = { price: 1 };
  } else if (sortBy === "hightolow") {
    sortQuery = { price: -1 };
  } else if (sortBy === "newest") {
    sortQuery = { createdAt: -1 };
  } else if (sortBy === "popular") {
    sortQuery = { sold: -1 };
  }

  try {
    const products = await productModel.find(filterQuery).sort(sortQuery).limit(20).lean();
    const success = req.flash("success");
    res.render("shop", { products, success, sortBy, user });
  } catch (err) {
    console.error("Shop route error:", err);
    res.status(500).send("Server Error");
  }
});

router.get("/addtocart/:productid", isLoggedIn, async function(req, res){
    let user = await userModel.findOne({email: req.user.email})
    user.cart.push(req.params.productid);
    await user.save();
    req.flash("success", "Added to Cart")
    res.redirect("/users/shop")
})

router.get("/cart", isLoggedIn, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email }).populate("cart");

    // If cart contains nulls due to missing products
    if (user.cart.includes(null)) {
        // Fetch raw user (not populated) to get raw ObjectIds
        const rawUser = await userModel.findOne({ email: req.user.email });

        const validProducts = await productModel.find({ _id: { $in: rawUser.cart } }, '_id');
        const validIds = validProducts.map(p => p._id);

        rawUser.cart = validIds;
        await rawUser.save();
        
        // Refetch updated and populated user
        user = await userModel.findOne({ email: req.user.email }).populate("cart");
    }
    let error = req.flash("error")
    let success = req.flash("success");
    res.render("cart", { user, success, error });
});

router.post("/cart/remove/:id", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });

    // Remove the item from the cart
    user.cart = user.cart.filter(item => item._id.toString() !== req.params.id);
    await user.save();

    req.flash("success", "Item removed from cart");
    res.redirect("/users/cart");
  } catch (err) {
    console.error("Error removing item from cart:", err);
    res.status(500).send("Something went wrong");
  }
});

router.get('/account', isLoggedIn, async (req, res) => {
  let user = await userModel
    .findOne({ email: req.user.email })
    .populate('cart')
    .lean();

  // Fetch full product data for each order
  for (let order of user.orders) {
    order.items = await productModel.find({
      _id: { $in: order.items }
    }).lean();
  }
  let success = req.flash("success")
  res.render('account', { user, success });
});

router.post('/upload/:id', isLoggedIn, upload.single('profilePic'), async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    user.fullname = req.body.fullname;

    if (req.file) {
      // Create uploads directory if not exists
      const uploadsDir = path.join(__dirname, '../public/uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Create unique filename
      const ext = path.extname(req.file.originalname);
      const filename = 'user-' + Date.now() + ext;
      const filePath = path.join(uploadsDir, filename);

      // Save buffer to disk
      fs.writeFileSync(filePath, req.file.buffer);

      // Save relative path in DB
      user.picture = '/uploads/' + filename;
    }

    await user.save();
    res.redirect('/users/account');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating profile");
  }
});

router.get('/edit/:id', isLoggedIn, async (req, res) => {
  const user = await userModel.findById(req.user._id);
  res.render('edit', { user });
});

router.post("/pay", isLoggedIn, async (req, res) => {
    const user = await userModel.findOne({ email: req.user.email }).populate("cart");

    if (!user || !user.cart || user.cart.length === 0) {
        req.flash("error", "Cart is empty.");
        return res.redirect("/users/cart");
    }

    const total = user.cart.reduce((sum, item) => sum + item.price, 0);
    res.render("fakepayment", { total , loggedin:false});
});

router.get('/cart/checkout', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email }).populate('cart');

    if (!user.cart.length) {
      req.flash('error', 'Your cart is empty');
      return res.redirect('/users/cart');
    }

    // Construct an order object with readable product info
    const order = {
      items: user.cart.map(p => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        discount: p.discount,
        image: p.image,
        date: new Date()
      })),
      totalAmount: user.cart.reduce((sum, p) => sum + (p.price - p.discount), 20), // + platform fee
      date: new Date()
    };

    // Add order to user orders and clear cart
    user.orders.push(order);
    user.cart = [];
    await user.save();

    req.flash("success", "Order placed successfully via UPI!");;
    res.redirect('/users/account');
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong during checkout.');
  }
});

router.get('/orders', isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ email: req.user.email }).populate('orders.items');
  res.render('orders', { user });
});

module.exports = router;