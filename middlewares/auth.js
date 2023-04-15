const { sendError } = require("../utils/helper");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.isAuth = async (req, res, next) => {

  //this token will contain 'Bearer <jwtToken>'
  const token = req.headers?.authorization;

  //if no token then don't move further
  if(!token) return sendError(res,"Invalid token")

  //we just want 'jwtToken' from this token so we need to split it
  //Now it will give us an array where we will have this bearer space
  //and this token itself. so token will be at 1st index(0 based indexing)
  const jwtToken = token.split("Bearer ")[1];

  //     But if this token is not there then it will throw an error.
  // So for that here we can check if there is no JWT token.
  // Then we'll return and use the sendError method
  if (!jwtToken) return sendError(res, "Invalid Token!");

  //now we can use a verify method from inside JWT.
  //And here we need to pass this token itself and
  //that will be a JWT token and the secret key which is an env variable
  const decode = jwt.verify(jwtToken, process.env.JWT_SECRET);

  //this decode will contain userId and iat (issued at time)
  //we can find out our user with this given userId.

  //so we will now destructure userId from decode
  //we are getting that userId from sign jwt Token i.e->
  // "const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);"
  const { userId } = decode;

  //now we find out this user by findById
  const user = await User.findById(userId);


  //So if there is no user, we can return error
  if (!user) return sendError(res, "Invalid token, user not found!", 404);

  //And if everything goes well, we can send a json response of user body through request
  //We are adding this user inside this req.user.
  req.user = user;
  next(); //go to next logic
};

exports.isAdmin = (req,res,next)=>{

  //we are going to use this middleware right after 'isAuth' middleware so req will contain
  //the user
  const {user} = req;

  //check if role is admin or not
  if(user.role!=='admin') return sendError(res,'Unauthorized access!');

  //move to next logic
  next();
}