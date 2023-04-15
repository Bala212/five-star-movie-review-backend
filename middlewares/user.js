const { isValidObjectId } = require("mongoose");
const PasswordResetToken = require("../models/passwordResetToken");
const { sendError } = require("../utils/helper");

//this is a middleware
exports.isValidPasswordResetToken = async (req, res, next) => {
  const { token, userId } = req.body;

  if (!token.trim() || !isValidObjectId(userId))
    return sendError(res, "Invalid request!");

  //If the user's data (token and id) is NOT stored in passwordResetToken model
  //it means token has expired i.e it has last more than 1 hour.
  const resetToken = await PasswordResetToken.findOne({ owner: userId });
  if (!resetToken) return sendError(res, "Unauthorized access,invalid request!");

  //compare token with user input token.
  const matched = await resetToken.compareToken(token);
  if (!matched) return sendError(res, "Unauthorized access,invalid request!");

  req.resetToken = resetToken;

  next();
};