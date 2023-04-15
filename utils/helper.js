const crypto = require("crypto");
const Review = require("../models/review");
const cloudinary = require("../cloud");
exports.sendError = (res, error, statusCode = 401) => {
  res.status(statusCode).json({ error });
};

exports.generateRandomByte = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(30, (err, buff) => {
      //if there's some error it will reject with error and ends the function
      if (err) reject(err);

      //if there is no error then resolve
      const bufferString = buff.toString("hex");
      resolve(bufferString);
    });
  });
};

exports.handleNotFound = (req, res) => {
  this.sendError(res, "Not found", 404);
};

exports.uploadImageToCloud = async (file) => {
  const { secure_url: url, public_id } = await cloudinary.uploader.upload(
    file,
    //this is to take face focsued of the image i.e we have optimized it
    { gravity: "face", height: 500, width: 500, crop: "thumb" }
  );
  return { url, public_id };
};

exports.formatActor = (actor) => {
  const { name, gender, about, _id, avatar } = actor;
  return {
    id: _id,
    name,
    about,
    gender,
    avatar: avatar?.url, //if there is any avatar then only read the url
  };
};

exports.parseData = (req, res, next) => {
  //fetch the data which needs to be parsed
  const { trailer, cast, tags, genres, writers } = req.body;

  //parse the data and simultaneously update it
  //parsing is to convert string data to object
  if (trailer) req.body.trailer = JSON.parse(trailer);
  if (cast) req.body.cast = JSON.parse(cast);
  if (genres) req.body.genres = JSON.parse(genres);
  if (writers) req.body.writers = JSON.parse(writers);
  if (tags) req.body.tags = JSON.parse(tags);
  next();
};

// AGGREGATION PIPE LINES
exports.averageRatingPipeline = (movieId) => {
  // pipeline is the set of operations that we want to perform inside, our document/record

  return [
    //lookup operator/operation
    {
      $lookup: {
        // go inside Review and select local field as rating
        from: "Review", // grab the data from review!
        localField: "rating", // local field of review will be rating!
        foreignField: "_id", // id of the review
        as: "avgRating", // name of the record we want to add
      },
    },
    //match operator/operation
    {
      // match the parent movie field, with this movie
      // we want to grab the reviews only with this movie! and parent movie stores that, of which movie is the review inside Review model
      $match: { parentMovie: movieId },
    },
    //group operator/operation
    {
      $group: {
        _id: null, // we don't want separate values, we want a single data, by default they are separate
        ratingAvg: {
          $avg: "$rating", // calculate the average of the rating
        },
        reviewCount: {
          $sum: 1, // it will count how many reviews? by adding one to the review count
        },
      },
    },
  ];
};

exports.relatedMovieAggregation = (movieId, tags) => {
  return [
    {
      $lookup: {
        // go inside Movie and select local field as tag
        from: "Movie", // grab the data from Movie!
        localField: "tag", // local field of movie will be tag!
        foreignField: "_id", // id of the review
        as: "relatedMovies", // name of the record we want to add
      },
    },
    //match operator/operation
    {
      // match the tags of movies, with this movie tags
      // we want to grab the movies only containing this movie tags!
      // i.e match the records with the tag
      $match: {
        // check if any movie has tag with ('in') this movie which we are displaying
        tags: { $in: [...tags] },
        // we want to exclude the current movie from related movies, as this movie will be also in the list
        _id: { $ne: movieId }, // 'ne' stands fom not equal
      },
    },
    //project operator/operation, just like map in javascript
    {
      $project: {
        // we just want title and poster
        // '1' means to select that property ans '0' means to not select
        title: 1,
        poster: "$poster.url",
        responsivePosters: "$poster.responsive",
      },
    },
    // just select first 5 matching records
    // so use 'limit' operator if mongoose
    {
      $limit: 5,
    },
  ];
};

exports.getAverageRatings = async (movieId) => {
  // use aggregation to find the average rating
  // pipeline is the set of operations that we want to perform inside, our document/record
  const [aggregatedResponse] = await Review.aggregate(
    this.averageRatingPipeline(movieId)
  );

  const reviews = {};

  //if there any review??
  if (aggregatedResponse) {
    // destructure rating and review count from response
    const { ratingAvg, reviewCount } = aggregatedResponse;

    // create an property inside reviews object declared above!
    // and add them!!
    reviews.ratingAvg = parseFloat(ratingAvg).toFixed(1);
    reviews.reviewCount = reviewCount;
  }

  // return reviews array containing average rating and review count
  return reviews;
};

exports.topRatedMoviesPipeline = (type) => {
  const matchOptions = {
    reviews: { $exists: true }, // if and only if there is any review?
    status: { $eq: "public" }, //status of movie should be public
  };

  // if there is any type match them!!
  if (type) matchOptions.type = { $eq: type };

  return [
    //lookup operator/operation
    {
      $lookup: {
        // go inside Movie and select local field as reviews
        from: "Movie", // grab the data from Movie!
        localField: "reviews", // local field of movie will be review! as we want to return movies with maximum review
        foreignField: "_id", // id of the review
        as: "topRated", // name of the record we want to add
      },
    },
    //match operator/operation
    {
      // match the type of movies, with requested movie type
      // we want to grab the movies only containing this movie type!
      // i.e match the records with the type
      $match: matchOptions,
    },
    //project operator/operation, just like map in javascript
    // it will create an array!! of set properties to 1
    {
      $project: {
        // we just want title and poster
        // '1' means to select that property ans '0' means to not select
        title: 1,
        poster: "$poster.url",
        responsivePosters: "$poster.responsive",
        reviewCount: { $size: "$reviews" }, // how many reviews? i.e the size of reviews array in movie schema!
      },
    },
    //sort by review count, decreasing fashion
    {
      $sort: {
        reviewCount: -1,
      },
    },
    // just select first 5 matching records
    // so use 'limit' operator if mongoose
    {
      $limit: 5,
    },
  ];
};
