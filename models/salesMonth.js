const mongoose=require("mongoose");
const {Schema}=mongoose;

// Define the schema for your model
const saleSchema = new mongoose.Schema({
    dateOfSale: Date,
    product: String,
    amount: Number,
  });
  
  const Sale = mongoose.model("Sale", saleSchema);
  module.exports=Sale;