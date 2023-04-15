const {
  sendError,
  formatActor,
  averageRatingPipeline,
  relatedMovieAggregation,
  getAverageRatings,
  topRatedMoviesPipeline,
} = require("../utils/helper");
const cloudinary = require("../cloud");
const Movie = require("../models/movie");
const Review = require("../models/review");
const { isValidObjectId } = require("mongoose");
const mongoose = require("mongoose");

exports.uploadTrailer = async (req, res) => {
  //fetch video file from the request

  //'file' is a default name for video, image, mp4 files in node
  const { file } = req;

  //if there is no any video file return with message
  if (!file) return sendError(res, "Video file is missing!");

  //file path is our machine path, generated automatically by file object
  //as this is video, we need to specify the resource_type
  const { secure_url: url, public_id } = await cloudinary.uploader.upload(
    file.path,
    { resource_type: "video" }
  );

  //send a json response of url and public id of that video file
  //url and public_id will be stored in database
  res.status(201).json({ url, public_id });
};

exports.createMovie = async (req, res) => {
  //fetch body(other than poster and trailer) and file(poster and trailer) from req
  const { file, body } = req;

  //fetch properties from body
  const {
    title,
    storyLine,
    director,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    language,
  } = body;

  const newMovie = new Movie({
    title,
    storyLine,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    trailer,
    language,
  });

  //director and writer are not required field so handle them separately

  if (director) {
    //director will be actor having object id
    if (!isValidObjectId(director))
      return sendError(res, "Invalid director id!");
    newMovie.director = director;
  }

  if (writers) {
    //writers will be array so check them their id's one by one
    for (let writerId of writers) {
      if (!isValidObjectId(writerId))
        return sendError(res, "Invalid writer id!");
    }
    newMovie.writers = writers;
  }

  //poster cannot be set this way so handle it separately

  //uploading poster

  // as poster is optional, we want to check if there is any poster!
  // and then upload
  if (file) {
    const {
      secure_url: url,
      public_id,
      responsive_breakpoints,
    } = await cloudinary.uploader.upload(file.path, {
      //to get poster with different sizes
      transformation: {
        width: 1280,
        height: 720,
      },
      responsive_breakpoints: {
        create_derived: true,
        //till what size you want poster
        max_width: 640,
        //how many maximum posters you want to generate
        max_images: 3,
      },
    });
    const finalPoster = { url, public_id, responsive: [] };

    //responsive_breakpoints will conation multiple objects of which
    //first one is for breakpoints i.e size images
    const { breakpoints } = responsive_breakpoints[0];

    if (breakpoints.length) {
      for (let imgObj of breakpoints) {
        //fetch url of different sizes of posters and push them in responsive array
        const { secure_url } = imgObj;
        finalPoster.responsive.push(secure_url);
      }
    }
    //set poster
    newMovie.poster = finalPoster;
  }
  //save movie to the database
  await newMovie.save();

  //send json response of properties of movie
  res.status(201).json({
    movie: {
      id: newMovie._id,
      title,
    },
  });
};

exports.updateMovieWithoutPoster = async (req, res) => {
  //fetch movieId from url
  const { movieId } = req.params;

  //check id movieId exists or not
  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie id!");

  //fetch the movie that has to be updated with movieId
  const movie = await Movie.findById(movieId);

  //if there is no such movie
  if (!movie) return sendError(res, "Movie not found!", 404);

  //if there is movie then update it

  //fetch details that has to be updated from the body
  const {
    title,
    storyLine,
    director,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    language,
  } = req.body;

  //update info
  movie.title = title;
  movie.storyLine = storyLine;
  movie.tags = tags;
  movie.releaseDate = releaseDate;
  movie.status = status;
  movie.type = type;
  movie.genres = genres;
  movie.cast = cast;
  movie.trailer = trailer;
  movie.language = language;

  //if there are director and movie update them
  if (director) {
    //director will be actor having object id
    if (!isValidObjectId(director))
      return sendError(res, "Invalid director id!");
    movie.director = director;
  }

  if (writers) {
    //writers will be array so check them their id's one by one
    for (let writerId of writers) {
      if (!isValidObjectId(writerId))
        return sendError(res, "Invalid writer id!");
    }
    movie.writers = writers;
  }

  //save updated movie to the database
  await movie.save();

  //send a json response
  res.send({ message: "Movie is updated!", movie });
};

exports.updateMovie = async (req, res) => {
  //fetch movieId from url
  const { movieId } = req.params;
  // fetch poster from req if any
  const { file } = req;

  //check id movieId exists or not
  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie id!");

  //check if there is any poster to update!
  // if (!req.file) return sendError(res, "Movie poster is missing!");

  //fetch the movie that has to be updated with movieId
  const movie = await Movie.findById(movieId);

  //if there is no such movie
  if (!movie) return sendError(res, "Movie not found!", 404);

  //if there is movie then update it

  //fetch details that has to be updated from the body
  const {
    title,
    storyLine,
    director,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    language,
  } = req.body;

  //update info
  movie.title = title;
  movie.storyLine = storyLine;
  movie.tags = tags;
  movie.releaseDate = releaseDate;
  movie.status = status;
  movie.type = type;
  movie.genres = genres;
  movie.cast = cast;
  movie.language = language;

  //if there are director and movie update them
  if (director) {
    //director will be actor having object id
    if (!isValidObjectId(director))
      return sendError(res, "Invalid director id!");
    movie.director = director;
  }

  if (writers) {
    //writers will be array so check their id's one by one
    for (let writerId of writers) {
      if (!isValidObjectId(writerId))
        return sendError(res, "Invalid writer ID!");
    }
    movie.writers = writers;
  }

  //update poster if any

  if (file) {
    //we need to check if the poster is already or not
    //if it is there delete it from the cloud and later store the new one
    const posterID = movie.poster?.public_id;
    if (posterID) {
      //if there is public_id, it means we have poster inside our database

      //remove the poster
      const { result } = await cloudinary.uploader.destroy(posterID);

      //if there is problem in removing the poster
      if (result !== "ok") {
        return sendError(res, "Could not update poster at the moment!");
      }
    }

    //upload new poster
    //uploading poster
    const {
      secure_url: url,
      public_id,
      responsive_breakpoints,
    } = await cloudinary.uploader.upload(req.file.path, {
      //to get poster with different sizes
      transformation: {
        width: 1280,
        height: 720,
      },
      responsive_breakpoints: {
        create_derived: true,
        //till what size you want poster
        max_width: 640,
        //how many maximum p  osters you want to generate
        max_images: 3,
      },
    });

    const finalPoster = { url, public_id, responsive: [] };

    //responsive_breakpoints will conation multiple objects of which
    //first one is for breakpoints i.e size images
    const { breakpoints } = responsive_breakpoints[0];

    if (breakpoints.length) {
      for (let imgObj of breakpoints) {
        //fetch url of different sizes of posters and push them in responsive array
        const { secure_url } = imgObj;
        finalPoster.responsive.push(secure_url);
      }
    }

    //set poster
    movie.poster = finalPoster;
  }

  //save updated movie to the database
  await movie.save();

  //send a json response
  res.send({
    message: "Movie is updated!",
    movie: {
      id: movie._id,
      title: movie.title,
      poster: movie.poster?.url,
      genres: movie.genres,
      status: movie.status,
    },
  });
};

exports.removeMovie = async (req, res) => {
  //fetch movieId from url/params
  const { movieId } = req.params;

  //check id movieId exists or not
  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie id!");

  //fetch the movie that has to be deleted with movieId
  const movie = await Movie.findById(movieId);

  //if there is no such movie
  if (!movie) return sendError(res, "Movie not found!", 404);

  //REMOVE POSTER

  //check if there is poster or not
  //if yes, we need to remove that.

  const posterID = movie.poster?.public_id;
  if (posterID) {
    //there is poster, so remove it
    //delete the poster
    const { result } = await cloudinary.uploader.destroy(posterID);
    //if there is some problem while removing the poster
    if (result !== "ok")
      return sendError(res, "Could not remove poster from cloud!");
  }

  //REMOVE TRAILER

  //remove the trailer of movie from cloud
  //so fetch the public_id of the trailer to delete it from cloud
  const trailerID = movie.trailer?.public_id;
  //if trailer is not present
  if (!trailerID)
    return sendError(res, "Could not find the trailer in the cloud!");

  //delete the trailer
  const { result } = await cloudinary.uploader.destroy(trailerID, {
    resource_type: "video",
  });

  //if there is some problem while removing the trailer
  if (result !== "ok")
    return sendError(res, "Could not remove trailer from cloud!");

  //REMOVE MOVIE FROM DATABASE

  //delete movie from the database i.e remove the schema of that movie from database
  await Movie.findByIdAndDelete(movieId);

  res.json({ message: "Movie removed successfully!" });
};

// pagination of movies
exports.getMovies = async (req, res) => {
  //fetch pageNo and limit from url
  const { pageNo = 0, limit = 10 } = req.query;
  // sort data according to latest created and skip first 'pageNo*limit' movies and fetch further movies till 'limit'
  // and store them inside 'movies'
  const movies = await Movie.find({})
    .sort({ createdAt: -1 })
    .skip(parseInt(pageNo) * parseInt(limit))
    .limit(parseInt(limit));
  // map/fetch according to frontend requirement
  const results = movies.map((movie) => {
    return {
      id: movie._id,
      title: movie.title,
      poster: movie.poster?.url,
      responsivePosters: movie.poster?.responsive,
      genres: movie.genres,
      status: movie.status,
    };
  });
  //send a json response
  res.json({ movies: results });
};

exports.getMovieForUpdate = async (req, res) => {
  //fetch movieId from url
  const { movieId } = req.params;

  // check if movieId is valid or not
  if (!isValidObjectId(movieId)) return sendError(res, "Id is invalid!");

  // find that movie which has to be update

  // -It will first find the movie with movieId. and it will go to the director.And it will also fetch
  //  director by the I.D which is the id of the director which is stored in the backend, as a profile
  //  of the director And it will add that whole profile of the director instead of just I.D..
  const movie = await Movie.findById(movieId).populate(
    "director writers cast.actor"
  );

  // map/fetch according to frontend/form requirement

  res.json({
    movie: {
      id: movie._id,
      title: movie.title,
      storyLine: movie.storyLine,
      poster: movie.poster?.url,
      releaseDate: movie.releaseDate,
      status: movie.status,
      type: movie.type,
      language: movie.language,
      genres: movie.genres,
      tags: movie.tags,
      director: formatActor(movie.director), // a single actor will act as a director
      writers: movie.writers.map((writer) => formatActor(writer)), // we want writers as ac format of actor
      cast: movie.cast.map((c) => {
        return {
          // cast has multiple properties like profile, roleAs and leadActor
          id: c.id,
          profile: formatActor(c.actor),
          roleAs: c.roleAs,
          leadActor: c.leadActor,
        };
      }),
    },
  });

  // //send a json response
  // res.json({ movies: results });
};

exports.searchMovie = async (req, res) => {
  // destructure title from url
  const { title } = req.query;

  // if there isn no title. i.e  if it is empty
  if (!title.trim()) return sendError(res, "Invalid request!");

  //find the movie with title entered in input of search movies
  // which is coming from frontend as a query in url
  const movies = await Movie.find({ title: { $regex: title, $options: "i" } });

  // send the formatted movie info to the frontend by iterating over the 'movies' set
  // this info will be displayed on the UI(frontend) so we will send only necessary info of the movie
  res.json({
    results: movies.map((m) => {
      return {
        id: m._id,
        title: m.title,
        poster: m.poster?.url,
        genres: m.genres,
        status: m.status,
      };
    }),
  });
};

exports.getLatestUploads = async (req, res) => {
  // fetch the limit of latest uploads from url as a query! default value will be 5
  const { limit = 5 } = req.query;

  // find the movies with status as public and sort them according to latest time of create and set limit ot 5
  // as we are going to display first five latest uploads, and store them inm results
  const results = await Movie.find({ status: "public" })
    .sort("-createdAt")
    .limit(parseInt(limit));

  // we are going to display only poster, trailer and id of the movie
  // so factor the data, into that format i.e map results and format each movie and store them in 'movies'
  const movies = results.map((m) => {
    return {
      id: m._id,
      title: m.title,
      storyLine: m.storyLine,
      poster: m.poster?.url,
      responsivePosters: m.poster.responsive,
      trailer: m.trailer?.url,
    };
  });

  //send a json response of this movies
  res.json({ movies });
};

exports.getSingleMovie = async (req, res) => {
  // destructure movie id from url(params)
  const { movieId } = req.params;

  // convert above id to object_id of the mongo using mongoose
  // as we can also pass this to aggregate function
  // mongoose.Types.ObjectId( movieId)

  // check is movieId is valid or not!
  if (!isValidObjectId(movieId))
    return sendError(res, "Movie id is not valid!");

  // if id is valid, find the movie with id and populate
  // director, cast(in that actor) and writers because we want to send their details to the frontend
  const movie = await Movie.findById(movieId).populate(
    "director writers cast.actor"
  );

  // // use aggregation to find the average rating
  // // pipeline is the set of operations that we want to perform inside, our document/record
  // const [aggregatedResponse] = await Review.aggregate(
  //   averageRatingPipeline(movie._id)
  // );

  // const reviews = {};

  // //if there any review??
  // if (aggregatedResponse) {
  //   // destructure rating and review count from response
  //   const { ratingAvg, reviewCount } = aggregatedResponse;

  //   // create an property inside reviews object declared above!
  //   // and add them!!
  //   reviews.ratingAvg = parseFloat(ratingAvg).toFixed(1);
  //   reviews.reviewCount = reviewCount;
  // }

  const reviews = await getAverageRatings(movie._id);

  //THIS 'movie' will contain a lot of information of the movie, like each and every detail of writer, cast, director trailer and many other info
  // but we just want some of the details out of them, just like name of the director, writer, cast( name and roleAs) , etc
  // so we need to format this information in a proper manner!! We want formatted data according to the UI

  // destructure the necessary data of the movie!
  const {
    _id: id,
    title,
    storyLine,
    cast,
    writers,
    director,
    releaseDate,
    genres,
    tags,
    language,
    poster,
    trailer,
    type,
  } = movie;

  // send a formatted json response!!
  res.json({
    movie: {
      _id: id,
      title,
      storyLine,
      releaseDate,
      genres,
      tags,
      language,
      type,
      poster: poster?.url, // send just url!!
      trailer: trailer?.url, //send just url!!
      cast: cast.map((c) => ({
        // format the cast, by mapping each cast
        id: c._id, // id of cast!! (each cast has its own id)
        profile: {
          // the profile of cast itself!!
          id: c.actor._id,
          name: c.actor.name,
          avatar: c.actor?.avatar?.url,
        },
        leadActor: c.leadActor,
        roleAs: c.roleAs,
      })),
      writers: writers.map((w) => ({
        // there are multiple writers!
        id: w._id, // id of writer (an actor itself)
        name: w.name, // name of the writer
      })),
      director: {
        // a single profile of director
        id: director._id,
        name: director.name,
      },
      reviews: { ...reviews },
    },
  });
};

exports.getRelatedMovies = async (req, res) => {
  // destructure movie id from url(params)
  const { movieId } = req.params;

  // convert above id to object_id of the mongo using mongoose
  // as we can also pass this to aggregate function
  // mongoose.Types.ObjectId( movieId)

  // check is movieId is valid or not!
  if (!isValidObjectId(movieId))
    return sendError(res, "Movie id is not valid!");

  // if id is valid, find the movie with id, to get the movie tags to fetch the related movies
  const movie = await Movie.findById(movieId);

  // use aggregation to find the movies with same tags as this movie
  const movies = await Movie.aggregate(
    relatedMovieAggregation(movie._id, movie.tags)
  );

  // to get the average rating of each movie!!!

  const mapMovies = async (m) => {
    // get the average rating of each movie and store it to return/send to the topRatedMovies
    const reviews = await getAverageRatings(m._id);

    // return the object with id, title, poster, and reviews
    return {
      id: m._id,
      title: m.title,
      poster: m.poster,
      responsivePosters: m.responsivePosters,
      reviews: { ...reviews },
    };
  };

  // fetch average Rating also for this movies, to show them on frontend
  //await for all the promises to be resolved
  const relatedMovies = await Promise.all(movies.map(mapMovies));

  // send a json response!!
  res.json({ movies: relatedMovies });
};

exports.getTopRatedMovies = async (req, res) => {
  // destructure type from url(query)
  // we have to find top rated movies by the type of movie
  // default will be 'film'
  const { type = "Film" } = req.query;

  // use aggregation to find the movies with same type as requested type
  const movies = await Movie.aggregate(topRatedMoviesPipeline(type));

  // to get the average rating of each movie!!!

  const mapMovies = async (m) => {
    // get the average rating of each movie and store it to return/send to the topRatedMovies
    const reviews = await getAverageRatings(m._id);

    // return the object with id, title, poster, and reviews
    return {
      id: m._id,
      title: m.title,
      poster: m.poster,
      responsivePosters: m.responsivePosters,
      reviews: { ...reviews },
    };
  };

  // fetch average Rating also for this movies, to show them on frontend
  //await for all the promises to be resolved
  const topRatedMovies = await Promise.all(movies.map(mapMovies));

  // send a json response!!
  res.json({ movies: topRatedMovies });
};

exports.searchPublicMovies = async (req, res) => {
  // destructure title from url
  const { title } = req.query;

  // if there isn no title. i.e  if it is empty
  if (!title.trim()) return sendError(res, "Invalid request!");

  //find the movie with title entered in input of search movies
  // which is coming from frontend as a query in url
  // status should be public
  const movies = await Movie.find({
    title: { $regex: title, $options: "i" },
    status: "public",
  });

  // to get the average rating of each movie!!!

  const mapMovies = async (m) => {
    // get the average rating of each movie and store it to return/send to the topRatedMovies
    const reviews = await getAverageRatings(m._id);

    // return the object with id, title, poster, and reviews
    return {
      id: m._id,
      title: m.title,
      poster: m.poster?.url,
      responsivePosters: m.poster?.responsive,
      reviews: { ...reviews },
    };
  };

  // fetch average Rating also for this movies, to show them on frontend
  //await for all the promises to be resolved
  const results = await Promise.all(movies.map(mapMovies));

  // send the formatted movie info to the frontend by iterating over the 'movies' set
  res.json({
    results,
  });
};
