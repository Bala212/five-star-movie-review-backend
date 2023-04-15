const express = require("express");
const { createActor, updateActor, removeActor, searchActor, getLatestActors, getSingleActor, getActors } = require("../controllers/actor");
const { isAuth, isAdmin } = require("../middlewares/auth");
const { uploadImage } = require("../middlewares/multer");
const { actorInfoValidator, validate } = require("../middlewares/validator");

//The express.Router() function is used to create a new router object.
const router = express.Router();

//uploadImage is a middleware, which will accept a single image with property name as avatar
router.post(
  "/create",
  isAuth,
  isAdmin,
  uploadImage.single("avatar"), //upload image of actor
  actorInfoValidator,
  validate,
  createActor
);

router.post(
  "/update/:actorId",
  isAuth,
  isAdmin,
  uploadImage.single("avatar"), //upload image of actor
  actorInfoValidator,
  validate,
  updateActor
);

router.delete("/:actorId",isAuth,
isAdmin,removeActor);

router.get("/search",isAuth,
isAdmin,searchActor);

router.get("/latest-uploads",isAuth,
isAdmin,getLatestActors);
// this is route of pagination!
router.get("/actors",isAuth,isAdmin,getActors)

router.get("/single/:actorId",getSingleActor); //we are not restricting this route to admin
//because we want to use this inside our frontend as well for the normal user

module.exports = router;
