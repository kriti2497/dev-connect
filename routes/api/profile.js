const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { check, validationResult, header } = require("express-validator");
const config = require("../../config/config");
const request = require("request");

// @route   GET api/profile/me
// @desc    Get logged in users profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );

    if (!profile) {
      return res
        .status(400)
        .json({ errors: [{ msg: "Profile does not exist" }] });
    }

    res.json(profile);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server Error");
  }
});

// @route   POST api/profile
// @desc    Create/update users profile
// @access  Private

router.post(
  "/",
  [
    auth,
    [
      check("designation", "Designation is required").not().isEmpty(),
      check("skills", "Skills are required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      githubusername,
      designation,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    let profileFields = {};

    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (designation) profileFields.designation = designation;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills)
      profileFields.skills = skills.split(",").map((each) => each.trim());

    profileFields.socials = {};

    if (youtube) profileFields.socials.youtube = youtube;
    if (facebook) profileFields.socials.facebook = facebook;
    if (twitter) profileFields.socials.twitter = twitter;
    if (instagram) profileFields.socials.instagram = instagram;
    if (linkedin) profileFields.socials.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        // update existing profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      // create a new profile
      profile = new Profile(profileFields);

      await profile.save();

      return res.json(profile);
    } catch (error) {
      console.error(error);
      return res.status(500).send("Server Error");
    }
  }
);

// @route   GET api/profile/all
// @desc    Get all users profile
// @access  Public

router.get("/all", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);

    return res.json({ profiles });
  } catch (error) {
    return res.status(500).send("Server Error");
  }
});

// @route   GET api/profile/:id
// @desc    Get users profile by id
// @access  Public

router.get("/:id", async (req, res) => {
  try {
    const userProfile = await Profile.findOne({
      user: req.params.id,
    }).populate("user", ["name", "avatar"]);
    if (!userProfile) return res.status(400).json({ msg: "Profile Not Found" });
    res.json({ userProfile });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ msg: "Profile Not Found" });
    }
    return res.status(500).send("Server Error");
  }
});

// @route   DELETE api/profile
// @desc    Delete user's profile, user and posts
// @access  Private

router.delete("/", auth, async (req, res) => {
  try {
    //TODO: remove user posts

    // remove user profile
    await Profile.findOneAndDelete({ user: req.user.id });
    // remove user
    await User.findOneAndDelete({ _id: req.user.id });

    return res.json({ msg: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
});

// @route   PUT api/profile/experience
// @desc    Update user's profile with experiences
// @access  Private

router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company Name is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, company, location, from, to, current, description } =
      req.body;

    const newExperience = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExperience);

      await profile.save();

      res.json({
        profile,
      });
    } catch (error) {
      return res.status(500).send("Server Error");
    }
  }
);

// @route   DELETE api/profile/experience/:expId
// @desc    Delete experience from user profile
// @access  Private

router.delete("/experience/:expId", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    const indexToRemove = profile.experience
      .map((exp) => exp.id)
      .indexOf(req.params.expId);

    if (indexToRemove === -1) {
      return res.status(400).json({ errors: ["Experience id not found"] });
    }
    profile.experience.splice(indexToRemove, 1);

    await profile.save();

    res.json(profile);
  } catch (error) {
    return res.status(500).send("Server Error");
  }
});

// @route   PUT api/profile/education
// @desc    Update user's profile with education
// @access  Private

router.put(
  "/education",
  [
    auth,
    [
      check("school", "School/University is required").not().isEmpty(),
      check("degree", "Degree is required").not().isEmpty(),
      check("fieldofstudy", "Field of study is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { school, degree, fieldofstudy, from, to, current, description } =
      req.body;

    const newEducation = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEducation);

      await profile.save();

      return res.json({ profile });
    } catch (error) {
      return res.status(500).send("Server Error");
    }
  }
);

// @route   DELETE api/profile/education/:edId
// @desc    Delete education from user's profile
// @access  Private

router.delete("/education/:edId", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    const indexToRemove = profile.education
      .map((edu) => edu.id)
      .indexOf(req.params.edId);

    if (indexToRemove === -1) {
      return res.status(400).json({ errors: ["Education id not found"] });
    }
    profile.education.splice(indexToRemove, 1);

    await profile.save();

    return res.json({ profile });
  } catch (error) {
    return res.status(500).send("Server Error");
  }
});

// @route   GET api/profile/github/:username
// @desc    Get user's github repos
// @access  Public

router.get("/github/:username", (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?sort=updated&per_page=5&client_id=${config.clientId}&client_secret=${config.clientSecret}`,
      method: "GET",
      headers: { "user-agent": "node.js" },
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({ errors: ["No Github profile found"] });
      }

      return res.json(JSON.parse(body));
    });
  } catch (error) {
    return res.status(500).send("Server Error");
  }
});

module.exports = router;
