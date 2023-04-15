const express = require("express");
const jwt = require("jsonwebtoken");
const {
  create,
  verifyEmail,
  resendEmailVerificationToken,
  forgotPassword,
  sendResetPasswordTokenStatus,
  resetPassword,
  signIn,
} = require("../controllers/user");
const { isValidPasswordResetToken } = require("../middlewares/user");
const {
  userValidator,
  validate,
  validatePassword,
  signInValidator,
} = require("../middlewares/validator");
const { sendError } = require("../utils/helper");
const User = require("../models/user");
const { isAuth } = require("../middlewares/auth");

//Express Routers are a way to organize your Express application such 
//that your primary app. js file does not become bloated and difficult to reason about.
//The express.Router() function is used to create a new router object. 
const router = express.Router();

router.post("/create", userValidator, validate, create);
router.post("/verify-email", verifyEmail);
router.post("/resend-email-verification-token", resendEmailVerificationToken);
router.post("/forgot-password", forgotPassword);
//this route is to check validity of forgot password token/otp.
// 'isValidPasswordResetToken' is middleware which this validity. (within one hour or not also)
router.post(
  "/verify-password-reset-token",
  isValidPasswordResetToken,
  sendResetPasswordTokenStatus
);

router.post(
  "/reset-password",
  validatePassword,
  validate,
  isValidPasswordResetToken,
  resetPassword
);

router.post("/sign-in", signInValidator, validate, signIn);

//sending authToken from frontend to this end point to find out given user is valid or not
router.get("/is-auth", isAuth, (req, res) => {
  //if all validations are done by isAuth middleware,
  //we will get a user body from it and we will send a json response of the same
  //i.e user body so destructure it form request and pass a json response
  const { user } = req;
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      role:user.role
    },
  });
});

module.exports = router;
