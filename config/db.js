const mongoose = require("mongoose");

const connectDB = () =>
  mongoose
    .connect(process.env.url)
    .then(() => console.log("connected to database"))
    .catch((err) => console.error("Failed to connect to MongoDB:", err));

module.exports = connectDB;
