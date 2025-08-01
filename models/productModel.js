const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  imagePath: {
    type: String, // Example: "/images/product-12345.webp"
    required: true
  },
  name: String,
  price: Number,
  discount: {
    type: Number,
    default: 0
  },
  bgcolor: String,
  panelcolor: String,
  textcolor: String,
  sold: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("product", productSchema);
