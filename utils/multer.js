// Desc: Multer config for uploading files

const multer = require("multer");
const storage = multer.diskStorage({});


// file filter for image files
const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image")) {
    cb("Supported only image files!", false);
  }
  cb(null, true);
};

// file filter for videos
const videoFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("video")) {
    cb("Supported only image files!", false);
  }
  cb(null, true);
};

exports.uploadImage = multer({ storage, fileFilter: imageFileFilter });
exports.uploadVideo = multer({ storage, fileFilter: videoFileFilter });