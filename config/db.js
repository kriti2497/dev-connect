const mongoose = require("mongoose");
const config = require("config");

const db = config.get("mongoURI");

const connectDB = async () => {
  try {
    await mongoose.connect(db);
    console.log("Mongoose connected");
  } catch (error) {
    console.error(error.message);
    // exit process
    process.exit(1);
  }
};

module.exports = connectDB;
