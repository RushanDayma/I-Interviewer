import multer from 'multer';
import path from 'path';

// Configure multer storage where we use diskStorage so that ram is not used for storing files, which is important for handling large files without crashing the server. The uploaded files will be stored in the 'uploads/' directory with a unique filename that includes a timestamp to prevent overwriting existing files.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Specify the directory where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname); // Get the file extension from the original filename
    const baseName = path.basename(file.originalname, ext); // Get the base name of the file without the extension
    const sessionId = req.params.id || req.params.sessionId || 'unknown'; // Get the session ID from the request parameters, or use 'unknown' if not available
    cb(null, `${sessionId}-${Date.now()}${ext}`); // Create a unique filename using the session ID and a timestamp
  }
});

const fileFilter = (req, file, cb) => {
  if(file.mimetype.startsWith('audio/') || file.mimetype.startsWith('application/octet-stream')) {  // Accept audio files and binary data (for WebRTC)
    cb(null, true); // Accept the file
  }
  else {
    cb(new Error('Unsupported file type'), false); // Reject the file with an error
  }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
}); // Create a multer instance with the defined storage and file filter

const uploadSingleAudio = upload.single('audioFile'); // Middleware to handle single file uploads with the field name 'audio'

export { uploadSingleAudio };