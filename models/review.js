const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  // OWNER, store info of user to connect this review with original owner, i.e who has given this review!
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // to populate(get detailed info from mongo db of this owner, who is the user only) the owner!!
    required: true,
  },

  //PARENT_MOVIE, i.e for which movie this review is!
  parentMovie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie", // to populate(get detailed info from mongo db of this movie) the movie!!
    required: true,
  },

  // RATING, i.e the stars
  rating: {
    //mandatory
    type: Number,
    required: true,
  },

  //CONTENT, a text with rating
  content: {
    // a optional field
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model("Review", reviewSchema);
