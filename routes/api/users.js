const express = require("express");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const { validationResult, check } = require("express-validator");
const User = require("../../models/User");
const config = require("../../config/config");

// @route   GET api/users
// @desc    Register user
// @access  Public
router.post(
  "/",
  [
    check("name", "Name is a required field").not().isEmpty(),
    check("password", "Please enter a password with 8-10 characters").isLength({
      min: 8,
      max: 10,
    }),
    check("email", "Please enter a valid email").isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // check if user exists
      const { name, email, password } = req.body;

      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }

      // get user gravatar

      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });

      user = new User({
        email,
        password,
        name,
        avatar,
      });

      // hash the password

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.jsonSecret,
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (error) {
      return res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
