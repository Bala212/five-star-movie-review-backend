const mongoose = require("mongoose");
const genres = require("../utils/genres");

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    storyLine: {
      //about the movie
      type: String,
      trim: true,
      required: true,
    },
    director: {
      //this is same as owner in emailVerification
      type: mongoose.Schema.Types.ObjectId,
      ref: "Actor",
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    status: {
      //public, private
      type: String,
      required: true,
      enum: ["public", "private"], //status can be pubic or private only
    },
    type: {
      //tv series,web series, etc
      type: String,
      required: true,
    },
    genres: {
      //action, drama, comedy, etc
      type: [String], //array of string
      required: true,
      enum: genres, //values from genres only
    },
    tags: {
      //tags to fetch some similar movies when user visits a single movie page
      type: [String], //array of string
      required: true,
    },
    cast: [
      //it as an array bcoz there can be multiple casts in a single movie
      {
        actor: { type: mongoose.Schema.Types.ObjectId, ref: "Actor" }, //which actor?
        roleAs: String, //what is the role of that actor in this movie?
        leadActor: Boolean, //is this cast a leadActor if this movie?
      },
    ],
    writers: [
      //it is an array because there can be multiple writers
      {
        type: mongoose.Schema.Types.ObjectId, //which actor?
        ref: "Actor",
      },
    ],
    poster: {
      //this is for image, url will serve as a poster of the movie
      //public_id will be unique id for the poster which we will be storing in cloud
      //and whenever we want to delete or remove that poster from cloud storage, we will
      //need this public_id so we will store the public id inside this object, we are taking
      //type as a object because we are storing two things (url and public_id)
      type: Object,
      url: { type: String, required: true }, //url from cloud storage
      public_id: { type: String, required: true }, //when we want to remove poster, we need this
      responsive: [URL], // array to store different size of posters
      required: true,
    },
    trailer: {
      //this is for video, url will serve as a trailer(video) of the movie
      //public_id will be unique id for the trailer which we will be storing in cloud
      //and whenever we want to delete or remove that trailer from cloud storage, we will
      //need this public_id so we will store the public id inside this object, we are taking
      //type as a object because we are storing two things (url and public_id)
      type: Object,
      url: { type: String, required: true }, //url from cloud storage
      public_id: { type: String, required: true }, //when we want to remove poster, we need this
      required: true,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    language: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);

//We will be storing everybody as an actor, and use them for different purposes!
//same actor can be writer in another movie, and same actor can be director in another
//movie and that same actor can act as actor in another movie
