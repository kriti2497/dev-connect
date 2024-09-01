const express = require("express");
const { check, validationResult } = require("express-validator");
const User = require("../../models/User");
const auth = require("../../middlewares/auth");
const Post = require("../../models/Post");

const router = express.Router();

// @route   POST api/posts
// @desc    Add/Create a new post
// @access  Private
router.post(
  "/",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const newPost = new Post({
        user: req.user.id,
        name: user.name,
        avatar: user.avatar,
        text: req.body.text,
      });

      const post = await newPost.save();

      return res.json({ post });
    } catch (error) {
      return res.status(500).send("Server Error");
    }
  }
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private

router.get("/all", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    return res.json({ posts });
  } catch (error) {
    return res.status(500).send("Server Error");
  }
});

// @route   GET api/posts/:id
// @desc    Get a post by id
// @access  Private

router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ errors: ["Post not found"] });
    }

    return res.json({ post });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ errors: ["Post not found"] });
    }
    return res.status(500).send("Server Error");
  }
});

// @route   DELETE api/posts/:id
// @desc    Delete a post by id, done by user who created the post
// @access  Private

router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ errors: ["Post Not found"] });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ errors: ["User is not authorized"] });
    }

    await post.deleteOne();

    return res.json({ msg: "Post deleted successfully" });
  } catch (error) {
    if (error === "ObjectId") {
      return res.status(404).json({ errors: ["Post Not found"] });
    }
    return res.status(500).send("Server Error");
  }
});

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private

router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ errors: ["Post does not exist"] });
    }

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: "Post has already been liked" });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    return res.json({ likes: post.likes });
  } catch (error) {
    return res.status(500).send("Server Error");
  }
});

// @route   DELETE api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private

router.delete("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ errors: ["Post does not exist"] });

    // check if we already have a like, onlu then we can unlike
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ errors: ["Post has not yet been liked"] });
    }

    // if post is liked, find its index to remove from likes array

    const indexToRemove = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(indexToRemove, 1);

    await post.save();

    return res.json({ likes: post.likes });
  } catch (error) {
    return res.status(500).send("Server Error");
  }
});

// @route   POST api/posts/comment/:id
// @desc    Comment on a post
// @access  Private

router.post(
  "/comment/:id",
  [auth, [check("text", "Comment is a required field").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const post = await Post.findById(req.params.id);
      const user = await User.findById(req.user.id).select("-password");

      if (!post) {
        return res.status(404).json({ errors: ["Post does not exist"] });
      }

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();

      return res.json({ comments: post.comments });
    } catch (error) {
      return res.status(500).send("Server Error");
    }
  }
);

// @route   DELETE api/posts/comment/:id/:commentId
// @desc    Delete a Comment on a post
// @access  Private

router.delete("/comment/:id/:commentId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ errors: ["No Post found"] });

    const user = await User.findById(req.user.id);

    const comment = post.comments.find(
      (comment) => comment.id === req.params.commentId
    );

    if (!comment)
      return res.status(404).json({ errors: ["Comment does not exist"] });

    if (comment.user.toString() !== req.user.id)
      return res.status(401).json({ errors: ["User is not authorized"] });

    let indexToRemove = post.comments
      .map((comment) => comment.id)
      .indexOf(req.params.commentId);
    post.comments.splice(indexToRemove, 1);

    await post.save();

    return res.json({ comments: post.comments });
  } catch (error) {
    return res.status(500).send("Server Error");
  }
});

module.exports = router;
