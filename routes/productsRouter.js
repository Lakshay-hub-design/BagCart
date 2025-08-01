const express = require('express');
const router = express.Router();
const upload = require("../config/multerConfig")
const productModel = require("../models/productModel")
const isOwner = require('../middleware/isOwner')

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

router.post("/create", upload.single("image"), async (req, res) => {
  try {
    const { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;

    if (!req.file) {
      req.flash("error", "No image uploaded");
      return res.redirect("/owners/create");
    }

    // 🔃 Generate unique filename
    const filename = `product-${Date.now()}.webp`;
    const filepath = path.join(__dirname, "../public/images/", filename);

    // 🗜️ Compress and convert image to webp
    await sharp(req.file.buffer)
      .resize({ width: 500 }) // Resize if needed
      .webp({ quality: 75 }) // Compress
      .toFile(filepath); // Save to disk

    // 🧠 Save path in DB
    const product = await productModel.create({
      imagePath: "/images/" + filename, // store relative path
      name,
      price,
      discount,
      bgcolor,
      panelcolor,
      textcolor,
      sold: 0,
    });

    req.flash("success", "Product created successfully");
    res.redirect("/owners/create");
  } catch (err) {
    res.send(err.message);
  }
});





module.exports = router;