require("dotenv").config();

const config = {
  mongoUri: process.env.MONGO_URI,
  jsonSecret: process.env.JSONWEBTOKENSECRET,
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_SECRET_ID,
};

module.exports = config;
