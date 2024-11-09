const mongoose=require("mongoose");
const {Schema}=mongoose;
const transactionSchema = new mongoose.Schema({
    productTitle: String,
    description: String,
    price: Number,
    dateOfSale: Date,
  });
  
  const Transaction = mongoose.model('Transaction', transactionSchema);
  module.exports=Transaction;