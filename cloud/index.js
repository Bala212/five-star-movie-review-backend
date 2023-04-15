const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  //Now this secure here we can add this true, which means now whenever we
  //upload image files inside cloudinary, it will create
  //our url with https which is more secure than http
  secure: true,
});

module.exports = cloudinary;