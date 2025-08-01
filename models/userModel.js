  const mongoose = require('mongoose')

  const userSchemma = mongoose.Schema({
    fullname: {
      type: String,
      minlength: 3,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "owner"],
      default: "user",
    },
    cart: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
      },
    ],
    orders: [
      {
        items: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
          },
        ],
        totalAmount: Number,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    contact: Number,
    picture: {
      type: String
    },
  }, {
  timestamps: true 
});

  module.exports = mongoose.model("user", userSchemma)