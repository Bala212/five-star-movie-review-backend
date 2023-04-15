const express = require("express");
const {
  uploadTrailer,
  getMovies,
  createMovie,
  removeMovie,
  getMovieForUpdate,
  updateMovie,
  searchMovie,
  getLatestUploads,
  getSingleMovie,
  getRelatedMovies,
  getTopRatedMovies,
  searchPublicMovies,
} = require("../controllers/movie");
const { isAuth, isAdmin } = require("../middlewares/auth");
const { uploadVideo, uploadImage } = require("../middlewares/multer");
const {
  validateMovie,
  validate,
  validateTrailer,
} = require("../middlewares/validator");
const { parseData } = require("../utils/helper");

//The express.Router() function is used to create a new router object.
const router = express.Router();

router.post(
  "/upload-trailer",
  isAuth,
  isAdmin,
  uploadVideo.single("trailer"),
  uploadTrailer
);

router.post(
  "/create",
  isAuth,
  isAdmin,
  uploadImage.single("poster"), //upload a poster,
  parseData,
  validateMovie,
  validateTrailer,
  validate,
  createMovie
);
// //to update the partial things we use patch
// router.patch(
//   "/update-movie-without-poster/:movieId",
//   isAuth,
//   isAdmin,
//   // parseData,
//   validateMovie,
//   validate,
//   updateMovieWithoutPoster
// );

router.patch(
  "/update/:movieId",
  isAuth,
  isAdmin,
  uploadImage.single("poster"), //upload a poster,
  parseData,
  validateMovie,
  validate,
  updateMovie
);

router.delete("/:movieId", isAuth, isAdmin, removeMovie);

// pagination of movies
router.get("/movies", isAuth, isAdmin, getMovies);

// to get data  according to movie from to update movie!
router.get("/for-update/:movieId", isAuth, isAdmin, getMovieForUpdate);

// for searching of movies, for admin
router.get("/search", isAuth, isAdmin, searchMovie);

// FOR NORMAL USERS!!

// five latest uploads (big posters!)
router.get("/latest-uploads", getLatestUploads);

// single movie
router.get("/single/:movieId", getSingleMovie);

// related movies
router.get("/related/:movieId", getRelatedMovies);

//get top rated movies
router.get("/top-rated", getTopRatedMovies);

// for searching of movies, for user
router.get("/search-public",searchPublicMovies);



module.exports = router;
