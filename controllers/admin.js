const Movie = require("../models/movie");
const Review = require("../models/review");
const User = require("../models/user");
const { topRatedMoviesPipeline, getAverageRatings } = require("../utils/helper");

exports.getAppInfo = async (req, res) => {
  // count no. of movies,reviews and users!
  const movieCount = await Movie.countDocuments();
  const reviewCount = await Review.countDocuments();
  const userCount = await User.countDocuments();

  // send info
  res.json({ appInfo: { movieCount, reviewCount, userCount } });
};

exports.getMostRated = async (req, res) => {

  // use aggregation to find the movies with same type as requested type
  const movies = await Movie.aggregate(topRatedMoviesPipeline());

  // to get the average rating of each movie!!!

  const mapMovies = async (m) => {
    // get the average rating of each movie and store it to return/send to the topRatedMovies
    const reviews = await getAverageRatings(m._id);

    // return the object with id, title, poster, and reviews
    return {
      id: m._id,
      title: m.title,
      reviews: { ...reviews },
    };
  };

  // fetch average Rating also for this movies, to show them on frontend
  //await for all the promises to be resolved
  const topRatedMovies = await Promise.all(movies.map(mapMovies));

  // send a json response!!
  res.json({ movies: topRatedMovies });
};
