const User = require("../models/user");
const jwt = require("jsonwebtoken");
const EmailVerificationToken = require("../models/emailVerificationToken");
const { isValidObjectId, default: mongoose } = require("mongoose");
const emailVerificationToken = require("../models/emailVerificationToken");
const { generateOTP, generateMailTransporter } = require("../utils/mail");
const { sendError, generateRandomByte } = require("../utils/helper");
const passwordResetToken = require("../models/passwordResetToken");
const PasswordResetToken = require("../models/passwordResetToken");
const bcrypt = require('bcrypt');

exports.create = async (req, res) => {
  //fetch user attributs from request.
  const { name, email, password } = req.body;

  //check if email already exists !?
  const oldUser = await User.findOne({ email });
  if (oldUser) {
    return sendError(res, "This email is already in use!");
  }

  //If user in new!!

  //create NEW user, it acts like a object and initialze it wiht fetched attributes.
  const newUser = new User({ name, email, password });

  //save the user to database
  // await is used because saving is time taking time
  await newUser.save();

  // ------ OTP ---------
  // 1)Generate 6 digit OTP
  let OTP = generateOTP();

  console.log("otp", OTP);

  // 2)Store otp inside Database.
  const newEmailVerificationToken = new EmailVerificationToken({
    owner: newUser._id,
    token: OTP,
  });

  await newEmailVerificationToken.save();

  // 3)Send that otp to user.
  var transport = generateMailTransporter();

  //send email
  transport.sendMail({
    from: "verification@review_app.com",
    to: newUser.email,
    subject: "Email Verification",
    html: `<p> Your OTP verification </p> <h1> ${OTP} </h1>`, //html template
  });


  //send a JSON response
  res.status(201).json({
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    },
  });
};

exports.verifyEmail = async (req, res) => {
  //this OTP has been came from user ( from front end)
  const { userId, OTP } = req.body;

  //User model verify kar


  //ID valid hein kya??
  if (!isValidObjectId(userId)) return sendError(res, "Invalid user!");

  //User exists krta hein kya??
  const user = await User.findById(userId);
  if (!user) return sendError(res, "User not found!", 404);

  //pehle se verified hein kya??
  if (user.isVerified) return sendError(res, "User is already verified!");

  //find user in emailVerificationTokenSchema
  const token = await emailVerificationToken.findOne({ owner: userId });
  if (!token.token) return sendError(res, "Token not found!");


  let match = await token.compareToken(OTP);
  if (!match) return sendError(res, "Please submit a valid OTP!");


  //If call comes here then the user is verified!!
  user.isVerified = true;

  //save status of the user
  await user.save();

  //once otp is verified there is no sense in storing token to the database so delete it from emailVerification model
  await EmailVerificationToken.findByIdAndDelete(token._id);

  //send welcome mail to user
  var transport = generateMailTransporter();

  //send email
  transport.sendMail({
    from: "verification@review_app.com",
    to: user.email,
    subject: "Welcome Email",
    html: "<h1>Welcome to our App, Thank you for choosing US!</h1>", //html template
  });

  const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

  res.json({
    user: {
      name: user.name,
      id: user._id,
      email: user.email,
      token:jwtToken,
      isVerified:user.isVerified,
      role:user.role
    },
    message: "Your email is verified!!",
  });
};

exports.resendEmailVerificationToken = async (req, res) => {
  const { userId } = req.body;

  //User exists krta hein kya??
  const user = await User.findById(userId);
  if (!user) return sendError(res, "User not found!", 404);

  //what if user is already verified!
  if (user.isVerified)
    return sendError(res, "This email ID is already verified!!");

  //check if token already exists in database if it already exists
  //then time is less than one hour
  const alreadyHasToken = await emailVerificationToken.findOne({
    owner: userId,
  });
  if (alreadyHasToken)
    return sendError(
      res,
      "Only after one hour you can request for another token!!"
    );

  //If none of the above are the cases... we will generate a new token
  // ------ OTP ---------
  // 1)Generate 6 digit OTP
  let OTP = generateOTP();

  // 2)Store otp inside Database.
  const newEmailVerificationToken = new EmailVerificationToken({
    owner: user._id,
    token: OTP,
  });
  await newEmailVerificationToken.save();

  // 3)Send that otp to user.
  var transport = generateMailTransporter();

  //send email
  transport.sendMail({
    from: "verification@review_app.com",
    to: user.email,
    subject: "Email Verification",
    html: `<p> Your OTP verification </p> <h1> ${OTP} </h1>`, //html template
  });

  //send a JSON response
  res
    .status(201)
    .json({ message: "New OTP has been sent to your email account!" });
};

exports.forgotPassword = async (req, res) => {
  //whenever user sends a request of forgot password, user will have its email attached
  //to the body of request.
  const { email } = req.body;

  // console.log(email);

  //if there is no email!!
  if (!email) return sendError(res, "Email is missing!");

  //Check if user exists or not in our database with that email ID !
  const user = await User.findOne({ email });
  if (!user) return sendError(res, "User not found!", 404);

  //if there exists a user.

  //what if a reset password token already exists of that user?? There is no need
  //to generate it again!

  //We will have a check in passwordResetToken Model for the same

  // console.log(user._id);
  const alreadyHasToken = await passwordResetToken.findOne({ owner: user._id });
  if (alreadyHasToken)
    return sendError(res,"Only after one hour you can request for another token");


  //send a token to the user through mail!
  const token = await generateRandomByte();

  //create new object of passwordReset model with a token and user_id ( owner)
  const newPasswordResetToken = new PasswordResetToken({
    owner: user._id,
    token,
  });

  // console.log(newPasswordResetToken);



  //save it to the database
  await newPasswordResetToken.save();

  //this will be a front end url (the port is different)
  const resetPasswordURL = `http://localhost:3000/auth/reset-password?token=${token}&id=${user._id}`;

  //send this url to the user
  var transport = generateMailTransporter();

  //send email
  transport.sendMail({
    from: "security@review_app.com",
    to: user.email,
    subject: "Reset Password Link",
    html: `<p> Click here to change the password</p><a href= ${resetPasswordURL} > Change Password </a>`, //html template
  });

  //send a JSON response
  res.status(201).json({ message: "Link sent to your email!" });
};

exports.sendResetPasswordTokenStatus = (req, res) => {
  res.json({ valid: true });
};

exports.resetPassword = async (req, res) => {
  //fetch newPassword nd userID of current user from request body
  const { newPassword, userId } = req.body;

  //fetch user belonging to that id.
  const user = await User.findById( userId);


  //check if old and new password are same ?
  const matched = await user.comparePassword(newPassword);

  if (matched)
    return sendError(res, "The new password must be different from old one!");

  //if password is not same as old password then reset it!! and save the user.
  user.password = newPassword;

  //no need to worry about hashing the password, bcoz the pasword is modified
  //so it will automatically call the 'pre' function ( which runs before saving user to database).
  await user.save();

  //remove that reset password token from the database as we have reseted it now!!
  await PasswordResetToken.findByIdAndDelete(req.resetToken._id);

  const transport = generateMailTransporter();

  //send email
  transport.sendMail({
    from: "security@review_app.com",
    to: user.email,
    subject: "Password reset Successfully",
    html: `<p>Password reset Successfully</p>
        <p>Now you can use New Password!`, //html template
  });

  //send a JSON response
  res.status(201).json({ message: "Password reset successfully, now you can use new password." });
};

exports.signIn = async (req, res) => {
  //fetch email and password entered by the user.
  const { email, password } = req.body;

  //check if user exists or not with that email ID.
  const user = await User.findOne({ email });
  if (!user) return sendError(res, "Email/Password mismatch!");

  //If user exists then check if password matches or not!!
  const matched = await user.comparePassword(password);
  if (!matched) return sendError(res, "Email/Password mismatch!");

  const { _id, name, isVerified, role } = user;

  //If password matches we will sign-in the user with a secret key called jwtToken provided by jsonWebToken (jwt)
  const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

  //a response that user is sign-in with the jwt-Token
  res.json({ user: { id: _id, name, email, role, token: jwtToken,isVerified, role } });
};