const multer = require("multer");

//to store files we need storage
const storage = multer.diskStorage({});

//req is request file is the actual file
//and cb is a callback function
const imageFileFilter = (req, file, cb) => {
  //to check if the file is image or not
  //file is a object which has property of mimetype which is image/png
  if (!file.mimetype.startsWith("image")) {
    cb("Supported only image files!");
  }
  console.log(file);
  //callback will take two things.
  // First argument will be the error
  // And the second thing will be true or false means if you want to move further or not
  cb(null, true);
};

//req is request file is the actual file
//and cb is a callback function
const videoFileFilter = (req, file, cb) => {
  //to check if the file is video or not
  //file is a object which has property of mimetype which corresponds to video/mp4
  if (!file.mimetype.startsWith("video")) {
    cb("Supported only video files!");
  }
  console.log(file);
  //callback will take two things.
  // First argument will be the error
  // And the second thing will be true or false means if you want to move further or not
  cb(null, true);
};

//configure the multer
exports.uploadImage = multer({ storage, fileFilter:imageFileFilter });
exports.uploadVideo = multer({ storage, fileFilter:videoFileFilter });
