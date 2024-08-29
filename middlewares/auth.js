const jwt = require("jsonwebtoken");
const config = require("./../config/config");

module.exports = function (req, res, next) {
  // get token
  const token = req.header("x-auth-token");

  // check if token exists
  if (!token) {
    return res
      .status(401)
      .json({ msg: "Token does not exist, authorization denied" });
  }

  // verify if token is valid

  try {
    const decodedToken = jwt.verify(token, config.jsonSecret);

    req.user = decodedToken.user;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token is invalid" });
  }
};
