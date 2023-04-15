const { isValidObjectId } = require("mongoose");
const Actor = require("../models/actor");
const {
  sendError,
  uploadImageToCloud,
  formatActor,
} = require("../utils/helper");
const cloudinary = require("../cloud");

exports.createActor = async (req, res) => {
  const { name, about, gender } = req.body;
  const { file } = req;

  //create new actor with their information
  const newActor = new Actor({ name, about, gender });

  //upload avatar i.e image to cloudinary
  //file.path will contain the path of that avatar which is store in our
  //machine

  //resource_type can add this image or video. by default is image so no
  //need to specify it

  //If you want to, you can choose this public ID or the name that you want
  //to give to your image file and make sure if you are using this public ID,
  //then these public IDs need to be unique every time because if they
  //are same The last upload will be removed and the previous upload will
  //be gone from your cloud storage.

  //but here we are not going to use this public I.D. because this cloud
  //in any will add a unique ID for all of our documents

  //the response from cloudinary will contain secure_url(https) and
  //public_id and many more things but we need this two things

  //secure url will contain the url of cloudinary which contains this image

  //upload image if and only if admin have chosen some avatar,
  //because avatar is not a required field
  //otherwise if there in no any image, that uploading process will give a error
  if (file) {
    const { url, public_id } = await uploadImageToCloud(file.path);

    //set this secure_url as url field of the avatar i.e backend will contain
    //the url of the image stored in cloudinary, instead of the actual image
    newActor.avatar = { url, public_id };
  }

  //save this newActor to the database
  await newActor.save();

  res.status(201).json({ actor: formatActor(newActor) });
};

exports.updateActor = async (req, res) => {
  //fetch info which has to be updated
  const { name, about, gender } = req.body;

  //if admin is also updating the avatar also fetch it
  const { file } = req;

  //fetch actor id from the requested url
  const { actorId } = req.params;

  //check if it is a valid object id
  if (!isValidObjectId(actorId)) {
    return sendError(res, "Invalid request!");
  }

  //if it is a valid objectId then store the actor with that id
  const actor = await Actor.findById(actorId);

  //if there is no actor
  if (!actor) {
    return sendError(res, "Invalid request, record not found!");
  }

  //fetch the public_id of avatar to remove/update it
  const public_id = actor.avatar?.public_id;

  //REMOVE OLD IMAGE IF THERE WAS ONE!

  //tya actor cha avatar exists karto ani navin update karayla ala ahe
  //tar mg to avatar destroy(remove) kara
  if (public_id && file) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok") {
      return sendError(res, "Could not remove image from cloud!");
    }
  }

  //UPDATE NEW AVATAR IF THERE IS ONE
  if (file) {
    const { url, public_id } = await uploadImageToCloud(file.path);

    //set this secure_url as url field of the avatar i.e backend will contain
    //the url of the image stored in cloudinary, instead of the actual image
    actor.avatar = { url, public_id };
  }

  //update NAME, GENDER AND ABOUT
  actor.name = name;
  actor.gender = gender;
  actor.about = about;

  //save the updated actor to the database
  await actor.save();

  //send a json response of actor info
  res.status(201).json({ actor: formatActor(actor) });
};

exports.removeActor = async (req, res) => {
  //fetch actor id from the requested url
  const { actorId } = req.params;

  //check if it is a valid object id
  if (!isValidObjectId(actorId)) {
    return sendError(res, "Invalid request!");
  }

  //if it is a valid objectId then store the actor with that id
  const actor = await Actor.findById(actorId);

  //if there is no actor
  if (!actor) {
    return sendError(res, "Invalid request, record not found!");
  }

  //REMOVE IMAGE from cloud IF THERE WAS ONE!
  //fetch the public_id of avatar to remove it
  const public_id = actor.avatar?.public_id;

  //tya actor cha avatar exists kar
  //tar mg to avatar destroy(remove) kara
  if (public_id) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok") {
      return sendError(res, "Could not remove image from cloud!");
    }
  }

  //remove that actor from database
  await Actor.findByIdAndDelete(actorId);

  res.json({ message: "Record removed successfully!" });
};

exports.searchActor = async (req, res) => {
  //search query will give us the name of actor
  const { name } = req.query;

  // if name string(input field on frontend is empty)
  if (!name.trim()) return sendError(res, "Invalid request!");

  //find the actor with name as query.name in database
  // const result = await Actor.find({ $text: { $search: `"${query.name}"` } });
  const result = await Actor.find({
    // options is for capital or small letters are allowed
    // this is the regular expression!
    name: { $regex: name, $options: "i" },
  });

  //get all matching actors, and send the json response of the same
  const actors = result.map((actor) => formatActor(actor));

  // send JSON response to frontend
  res.json({ results: actors });
};

exports.getLatestActors = async (req, res) => {
  //fetch latest actors according to timestamp from  database in descending order
  const result = await Actor.find().sort({ createdAt: "-1" }).limit(12);
  const actors = result.map((actor) => formatActor(actor));
  res.json(actors);
};

exports.getSingleActor = async (req, res) => {
  //fetch actorId from url/request params
  const { actorId } = req.params;

  console.log(actorId);

  //check if it is a valid object id
  if (!isValidObjectId(actorId)) {
    return sendError(res, "Invalid request!");
  }

  //if it is a valid objectId then store the actor with that id
  const actor = await Actor.findById(actorId);

  //if there is no actor
  if (!actor) {
    return sendError(res, "Invalid request, record not found!", 404);
  }
  res.json({ actor: formatActor(actor) });
};

exports.getActors = async (req, res) => {
  //fetch actorId from request i.e things after '?'
  const { pageNo = 0, limit = 20 } = req.query;

  //find the actors with limit using skip formula

  // fetch actors till 'limit' starting from 'skip+1' i.e we will skip first pageNo*limit actors
  // and sort them with time to select latest actors
  const actors = await Actor.find({})
    .sort({ createdAt: -1 })
    .skip(parseInt(pageNo) * parseInt(limit))
    .limit(parseInt(limit));

  // create an array of actors(named profiles) by formatting them
  const profiles = actors.map((actor) => {
    return formatActor(actor);
  });
  //send json response of this actors !!
  res.json({
    profiles,
  });
};