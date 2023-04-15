const { check, validationResult } = require("express-validator");
const { isValidObjectId } = require("mongoose");
const genres = require("../utils/genres");

exports.userValidator = [
  check("name").trim().not().isEmpty().withMessage("Name is missing!"),

  check("email").normalizeEmail().isEmail().withMessage("Email is Invalid!!!"),

  check("password")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password is missing!")
    .isLength({ min: 8, max: 20 })
    .withMessage("Password must be 8 to 20 characters long!"),
];

exports.validatePassword = [
  check("newPassword")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password is missing!")
    .isLength({ min: 8, max: 20 })
    .withMessage("Password must be 8 to 20 characters long!"),
];

exports.signInValidator = [
  check("email").normalizeEmail().isEmail().withMessage("Email is Invalid!!!"),

  check("password").trim().not().isEmpty().withMessage("Password is missing!"),
];

exports.actorInfoValidator = [
  check("name").trim().not().isEmpty().withMessage("Actor name is missing!"),
  check("about").trim().not().isEmpty().withMessage("About is missing!"),
  check("gender")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Gender is a required field!"),
];

exports.validateMovie = [
  check("title").trim().not().isEmpty().withMessage("Movie title is missing!"),
  check("storyLine")
    .trim()
    .not()
    .isEmpty()
    .withMessage("StoryLine is important!"),
  check("language").trim().not().isEmpty().withMessage("Language is missing!"),
  check("releaseDate").isDate().withMessage("Release date is missing!"),
  check("status")
    .isIn(["public", "private"])
    .withMessage("Movie status must be public or private!"),
  check("type").trim().not().isEmpty().withMessage("Movie type is missing!"),
  check("genres")
    .isArray()
    .withMessage("Genres must be an array of strings!")
    .custom((value) => {
      //value is coming from frontend
      for (let g of value) {
        //check if the 'g' from array 'values' exists in our enum of genres or not
        if (!genres.includes(g)) throw Error("Invalid genres!");
      }
      return true;
    }),
  check("tags")
    .isArray({ min: 1 })
    .withMessage("Tags must be an array of strings!")
    .custom((tags) => {
      for (let tag of tags) {
        if (typeof tag !== "string")
          throw Error("Tags must be an array of strings!");
      }
      return true;
    }),
  check("cast")
    .isArray()
    .withMessage("Cast must be an array of objects!")
    .custom((cast) => {
      //value is coming from frontend
      for (let c of cast) {
        //check if the 'g' from array 'values' exists in our enum of genres or not
        if (!isValidObjectId(c.actor))
          throw Error("Invalid cast id inside cast!");
        if (!c.roleAs?.trim()) throw Error("Role as is missing inside cast!");
        if (typeof c.leadActor !== "boolean")
          throw Error(
            "Only accepted boolean value inside leadActor inside cast!"
          );
      }
      return true;
    }),

  //we are not writing this validation logic in imageFileFilter because when we do not upload
  //any poster that filter method will not run, so we are validating it here i.e in express-validator
  // check('poster').custom((_,{req})=>{
  //   if(!req.file) throw Error('Poster file is missing!')

  //   //if no error
  //   return true;
  // })
  //we are not validating director and writers here bcoz they are not required fields
];

exports.validateRatings = check(
  "rating",
  "Rating must be a number between 0 and 10."
).isFloat({ min: 0, max: 10 });

exports.validate = (req, res, next) => {
  const errors = validationResult(req).array();
  if (errors.length) {
    return res.json({ error: errors[0].msg });
  }
  next();
};

exports.validateTrailer =
  //now check for trailer url and public_id
  check("trailer")
    .isObject()
    .withMessage("Trailer must be an object with url and public_id")
    .custom(({ url, public_id }) => {
      //in javascript we have 'new URL' which accepts the url and throw an error if its not valid
      //to catch that error we will use try catch block
      try {
        //check if url is valid or not
        const result = new URL(url);
        if (!result.protocol.includes("http"))
          throw Error("Trailer url is not valid!");

        //now check for public_id

        //url will contain public_id at last i.e
        //"https://res.cloudinary.com/dukbvsba9/video/upload/v1679478955/saqmcstzx7qarghjafjy.mp4"
        //here saqmcstzx7qarghjafjy is a public_id so fetch it from url by splitting the url
        const arr = url.split("/");
        //take last split with / and again split it with '.' (id.mp4) and take first element, that
        //will be public_id
        const publicId = arr[arr.length - 1].split(".")[0];

        //now check id from url is it equal to the trailer public_id i.e actual public id
        if (publicId !== public_id)
          throw Error("Trailer public_id is not valid!");

        //if everything is fine
        return true;
      } catch (error) {
        throw Error("Trailer url is not valid!");
      }
    });
