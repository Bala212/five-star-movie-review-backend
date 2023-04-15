const { addReview, updateReview, removeReview, getReviewsByMovie } = require("../controllers/review");
const { isAuth } = require("../middlewares/auth");
const { validate, validateRatings } = require("../middlewares/validator");

const router = require("express").Router();

//add a review
router.post("/add/:movieId", isAuth, validateRatings, validate, addReview);

// patch is to update!!
router.patch("/:reviewId", isAuth, validateRatings, validate, updateReview);

// delete a review (no need of validation, common sense)
router.delete("/:reviewId", isAuth, removeReview);

// get reviews related to a single movie!!
// user doesn't need to be authenticated, because user just want to visit the app and want to read the reviews
router.get("/get-reviews-by-movie/:movieId", getReviewsByMovie)

module.exports = router;
