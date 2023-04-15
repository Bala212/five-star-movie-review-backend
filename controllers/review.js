const { isValidObjectId } = require("mongoose");
const { sendError, getAverageRatings } = require("../utils/helper");
const Movie = require("../models/movie");
const Review = require("../models/review");

exports.addReview = async (req, res) => {
  // destructure movieId from url as a params
  const { movieId } = req.params;

  // fetch content and rating from frontend
  const { content, rating } = req.body;

  // whenever we add the review , we need the owner, i.e who is adding the review
  // that user is which is currently authenticated, and it is present in isAuth middleware
  const userId = req.user._id;

  // VALIDATION!!

  // if the current user is not verified, i.e Email verification
  if(!req.user.isVerified) return sendError(res,"Please verify your email first!")

  // check movieId is valid or not
  if (!isValidObjectId(movieId)) return sendError(res, "Invalid Movie!");

  // find the movie!! for which we have to add the review
  // we don't want ot add review for private movie!
  const movie = await Movie.findOne({ _id: movieId, status: "public" });

  // check movie is there or not
  if (!movie) return sendError(res, "Movie not found!", 404);

  // if user has already reviewed this movie, then we don't want to review that user again, and also check for this movie only!!(parentMovie!!)
  // owner is the property name used in Review schema
  const isAlreadyReviewed = await Review.findOne({
    owner: userId,
    parentMovie: movie._id,
  });

  // check movie is already reviewed by the same user or not
  if (isAlreadyReviewed)
    return sendError(res, "Invalid request, review is already there!");

  // CREATE and ADD REVIEW to the movie model

  // create
  const newReview = new Review({
    owner: userId, // by whom?
    parentMovie: movie._id, // for which movie?
    content,
    rating,
  });

  // updating review for movie!
  // add this new review(id, as we are storing only id of the reviews) to the movie(as movie schema has a property of reviews which is an array of reviews)
  movie.reviews.push(newReview._id);

  // save that movie again with the review!!
  await movie.save();

  // save new review
  await newReview.save();

  //updating the UI with new Review, by sending the review the frontend
  const reviews = await getAverageRatings(movie._id);

  // send a json response
  res.json({ message: "Your review has been added.", reviews });
};

exports.updateReview = async (req, res) => {
  // destructure reviewId from url as a params
  const { reviewId } = req.params;

  // fetch content and rating from frontend
  const { content, rating } = req.body;

  // whenever we want to update the review , we need the owner, i.e who is updating the review
  // that user is which is currently authenticated, and it is present in isAuth middleware
  const userId = req.user._id;

  // VALIDATION!!

  // check reviewId is valid or not
  if (!isValidObjectId(reviewId)) return sendError(res, "Invalid Review ID!");

  // find the review which we want to update, with exact userId and exact movie
  // i.e the review given by the user which is authenticated and a review with id we get from the params!!
  // also is this review belonging to this user?
  const review = await Review.findOne({ owner: userId, _id: reviewId });

  // check review is there or not
  if (!review) return sendError(res, "Review not found!", 404);

  // UPDATE
  // if there is review, update them
  review.content = content;
  review.rating = rating;

  // save that review again with the updated review!!
  await review.save();

  // send a json response
  res.json({ message: "Your review has been updated." });
};

exports.removeReview = async (req, res) => {
  // destructure reviewId from url as a params
  const { reviewId } = req.params;

  // whenever we want to remove the review , we need the owner, i.e who is removing the review
  // that user is which is currently authenticated, and it is present in isAuth middleware
  const userId = req.user._id;

  // VALIDATION!!

  // check reviewId is valid or not
  if (!isValidObjectId(reviewId)) return sendError(res, "Invalid Review ID!");

  // find the review which we want to remove, with exact userId and exact movie
  // i.e the review given by the user which is authenticated and a review with id we get from the params!!
  // also is this review belonging to this user?
  const review = await Review.findOne({ owner: userId, _id: reviewId });

  // check review is there or not
  if (!review) return sendError(res, "Invalid request, Review not found!", 404);

  // REMOVE

  // find the movie which has this review, so that we can remove the review from that movie too
  // this review contains parentMovie, which indicates of which movie the review is?
  // and select the reviews only of that movie!
  const movie = await Movie.findById(review.parentMovie);
  // const movie = await Movie.findById(review.parentMovie).select("reviews");

  // now remove this review from array of reviews from movie model, by filtering the reviews array
  // if we found any rId equal to current review id which we want to delete, exclude it from reviews array and update reviews array to filtered array
  // reviews array in movie only contains review id's
  movie.reviews = movie.reviews.filter((rId) => {
    rId !== reviewId;
  });

  // remove that review from Review model!!
  await Review.findByIdAndDelete(reviewId);

  // save that movie again with the updated review!!
  await movie.save();

  // send a json response
  res.json({ message: "Review removed successfully." });
};

exports.getReviewsByMovie = async (req, res) => {
  // destructure movieId from url as a params
  const { movieId } = req.params;

  // VALIDATION!!

  // check movieId is valid or not
  if (!isValidObjectId(movieId)) return sendError(res, "Invalid Movie ID!");

  // find the movie with requested movieId
  // and populate the reviews stored in movie model, which belongs to this movie
  // and also we need to display the name of the reviewer, so also populate the owner of that review

  // first populate reviews from movie, and then again populate owner(name specifically) from that review
  const movie = await Movie.findById(movieId)
    .populate({
      // deep population
      path: "reviews", // this is storing review id's
      populate: {
        path: "owner", // populate owner from reviews!!
        select: "name", // select name of that owner
      },
    })
    .select("reviews title"); // select reviews and title

  // THIS IS THE OUTPUT OF movie.reviews
  //   {
  //     "_id": "642f2b45a5f92fe5c8e74cf2",  // review id
  //     "owner": {                           // user
  //         "_id": "642ac25ad3d804b08dd1556b",
  //         "name": "Tejas"
  //     },
  //     "parentMovie": "642c9e3bcec8b5995a943ca5", //parent movie id
  //     "rating": 6,
  //     "content": "Thik thaak Movie!!",
  //     "__v": 0
  // }

  // NOW WE WANT TO FORMAT THIS DATA TO SEND TO THE FRONTEND!

  // format the reviews by iterating them
  const reviews = movie.reviews.map((r) => {
    // destructure owner, content, rating and id of the review from review
    const { owner, content, rating, _id: reviewId } = r;

    // destructure name, and id of the user(owner) from owner
    const { name, _id: ownerId } = owner;

    return {
      // return reviewId, who has given the review, content and rating
      id: reviewId,
      owner: {
        id: ownerId,
        name,
      },
      content,
      rating,
    };
  });

  // THIS IS THE FORMATTED DATA BY ABOVE LOGIC ->( res.json({ reviews });)
  //   {
  //     "id": "642f2b45a5f92fe5c8e74cf2",
  //     "owner": {
  //         "id": "642ac25ad3d804b08dd1556b",
  //         "name": "Tejas"
  //     },
  //     "content": "Thik thaak Movie!!",
  //     "rating": 6
  // }

  // send a json response, title and reviews
  res.json({ movie: { title: movie.title, reviews } });
};
