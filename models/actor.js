const mongoose = require("mongoose");

const actorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    about: {
      //description of actor
      type: String,
      trim: true,
      required: true,
    },
    gender: {
      type: String,
      trim: true,
      required: true,
    },
    avatar: {
      //this is for image, url will serve as a profile picture of the actors
      //public_id will be unique id for the avatar which we will be storing in cloud
      //and whenever we want to delete or remove that asset(image) from cloud storage, we will
      //need this public id so we will store the public id inside this object, we are taking
      //type as a object because we are storing two things (url and public_id)
      type: Object,
      url: String,
      public_id: String,
    },
  },
  //This timestamp will maintain the time whenever we create this actor
  //or whenever we update this actor, that time will be recorded inside our database 
  //and it will help us whenever we will fetch these users, Like if we want to fetch
  //these users according to the created that time, then we can use this timestamp.
  { timestamps: true }
);

actorSchema.index({name:"text"});

module.exports = mongoose.model("Actor", actorSchema);
