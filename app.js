const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const Product = require("./models/seeddata.js");
const Sale = require("./models/salesMonth.js");
const Transaction = require("./models/transation.js");

const app = express();
let port=8080


//Connect to db
async function main(){
  mongoose.connect("mongodb://127.0.0.1:27017/codingChallenge");
}

main().then((res)=>{console.log("connected to db")}).catch((err)=>{console.log(err)});

// API endpoint
app.get("/db",async(req, res)=>{
  try 
  {
    const response = await axios.get("https://s3.amazonaws.com/roxiler.com/product_transaction.json");
    const products = response.data;
    await Product.deleteMany();
    await Product.insertMany(products);
    res.json({ message: "Database initialize" });
  } 
  catch (error) 
  {
    console.error("Error initializing database:", error);
    res.json({ message: "Failed database" });
  }
});

async function seedMockData() {
  try {
    await Transaction.deleteMany(); 
    await Transaction.insertMany(mockTransactions); 
    console.log("Mock data seeded successfully.");
  } catch (error) {
    console.error("Error seeding mock data:", error);
  }
}
//  month name to number
const monthToNumber = (monthName) => {
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  return months.indexOf(monthName) + 1;
};
// Mock data array
const mockTransactions = [
  { productTitle: "Milk", price: 20, isSold: true, dateOfSale: new Date("2023-08-15") },
  { productTitle: "Cheese", price: 50, isSold: true, dateOfSale: new Date("2023-08-10") },
  { productTitle: "Butter", price: 30, isSold: false, dateOfSale: new Date("2023-08-05") },
  
];



// Call this function to seed data after establishing database connection
main().then(async () => {
  console.log("Connected to db");
  await seedMockData(); // Seed mock data for testing
});

// API to get sales 
app.get("/api/sales/:month", async (req, res) => {
  const month = req.params.month;
  const monthNumber = monthToNumber(month);
  console.log(`Requested month: ${month}, Mapped month number: ${monthNumber}`);
  if (monthNumber === 0) {
    return res.status(400).json({ error: "Invalid month name" });
  }
  try {
    const sales = await Sale.find({
      $expr: {
        $eq: [{ $month: "$dateOfSale" }, monthNumber],
      },
    });
    console.log(`Sales found: ${sales.length}`);
    res.json(sales);
  } 
  catch (err) {
    console.error("Error querying sales:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const { search = '', page = 1, perPage = 10 } = req.query;

    const query = {};
    if (search) {
      const searchConditions = [
        { productTitle: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
      const searchAsNumber = parseFloat(search);
      if (!isNaN(searchAsNumber)) {
        searchConditions.push({ price: searchAsNumber });
      }
      query.$or = searchConditions;
    }
    const pageNumber = parseInt(page, 10);
    const itemsPerPage = parseInt(perPage, 10);
    const skip = (pageNumber - 1) * itemsPerPage;

    const transactions = await Transaction.find(query).skip(skip).limit(itemsPerPage);
    const totalRecords = await Transaction.countDocuments(query);

    res.json({
      transactions,
      page: pageNumber,
      perPage: itemsPerPage,
      totalRecords,
      totalPages: Math.ceil(totalRecords / itemsPerPage),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
});

function getMonthDateRange(monthName) {
  const month = monthToNumber(monthName);
  if (month === 0) return null;

  const year = new Date().getFullYear(); 
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59); 

  return { startDate, endDate };
}
// GET /api/statistics// GET /api/statistics
app.get('/api/statistics', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ message: 'Month is required' });
    const dateRange = getMonthDateRange(month);
    if (!dateRange) return res.status(400).json({ message: 'Invalid month' });
    const { startDate, endDate } = dateRange;
    const matchDateQuery = {
      dateOfSale: { $gte: startDate, $lte: endDate }
    };
    const totalSaleAmount = await Transaction.aggregate([
      { $match: { ...matchDateQuery, isSold: true } },
      { $group: { _id: null, totalAmount: { $sum: '$price' } } }
    ]);
    
    const totalSoldItems = await Transaction.countDocuments({
      ...matchDateQuery,
      isSold: true
    });
    const totalNotSoldItems = await Transaction.countDocuments({
      ...matchDateQuery,
      isSold: false
    });

    res.json({
      totalSaleAmount: totalSaleAmount[0]?.totalAmount || 0,
      totalSoldItems,
      totalNotSoldItems
    });
  } catch (error) {
    console.error("Error in statistics endpoint:", error);
    res.status(500).json({ message: 'Server Error', error });
  }
});


app.listen(port, () => {
  console.log(`connected to:${port}`);
});