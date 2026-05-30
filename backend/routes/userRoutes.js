import express from "express";
import { registerUser, loginUser, googleAuth, getUserProfile, updateUserProfile} from "../controllers/userController.js"; // Import the registerUser and loginUser functions from the userController to handle user registration and login logic
import { protect } from "../middleware/authMiddleware.js"; // Import the protect middleware to secure routes that require authentication

const router = express.Router();

router.post('/register', registerUser); // Define a POST route for user registration that calls the registerUser controller function when accessed
router.post('/login', loginUser); // Define a POST route for user login that calls the loginUser controller function when accessed
router.post('/google-auth', googleAuth); // Define a POST route for Google authentication that calls the googleAuth controller function when accessed
router.get('/profile', protect, getUserProfile); // Define a GET route for fetching user profile that is protected by the protect middleware and calls the getUserProfile controller function when accessed
router.put('/profile', protect, updateUserProfile); // Define a PUT route for updating user profile that is protected by the protect middleware and calls the updateUserProfile controller function when accessed


export default router; // Export the router to be used in the main server file for handling user-related routes