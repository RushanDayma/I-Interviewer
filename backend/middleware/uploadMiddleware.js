import multer from 'multer';

// Configure multer storage where we use diskStorage so that ram is not used for storing files, which is important for handling large files without crashing the server. The uploaded files will be stored in the 'uploads/' directory with a unique filename that includes a timestamp to prevent overwriting existing files.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Specify the directory where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Generate a unique filename using the current timestamp and original filename
  }
});