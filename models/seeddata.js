const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  category: { type: String, required: true },
  image: { type: String },
  sold: { type: Boolean, default: false },
  dateOfSale: { type: Date },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
