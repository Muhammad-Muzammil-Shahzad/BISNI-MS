const mongoose = require("mongoose");
async function connectDB() {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log("Database is Connected");
  } catch (error) {
    console.error("Database Connection Error: ", error);
  }
}

module.exports = connectDB;
