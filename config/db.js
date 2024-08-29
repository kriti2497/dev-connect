const mongoose = require("mongoose");
const config = require("./config.js");

const db = config.mongoUri;

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
