import asyncHandler from "express-async-handler";  // Import express-async-handler to handle asynchronous route handlers and catch errors without try-catch blocks
import User from "../models/User.js"; // Import the User model to interact with the users collection in the database
import { OAuth2Client } from "google-auth-library";// Import the OAuth2Client from google-auth-library to verify Google ID tokens for authentication
import jwt from "jsonwebtoken"; // Import jsonwebtoken to generate JWT tokens for user authentication and authorization

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); 

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1d', // Token expires in 30 days
  });
}

const registerUser  = asyncHandler(async (req, res) => {
  const {name, email, password} = req.body;
  if(!name || !email || !password){
    res.status(400);
    throw new Error("Please fill in all fields");
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
  });
  if(user){
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      preferredRole: user.preferredRole,
      token: generateToken(user),
    });
  }else{
    res.status(400);
    throw new Error("Invalid user data");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const {email, password} = req.body;
  if(!email || !password){
    res.status(400);
    throw new Error("Please fill in all fields");
  }
  const user = await User.findOne({ email }); // Find the user by email in the database. This is necessary to check if the user exists and to retrieve the hashed password for comparison.
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      preferredRole: user.preferredRole,
      token: generateToken(user),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

const googleAuth = asyncHandler(async (req, res) => {
  const { tokenId } = req.body; // The tokenId is the ID token received from the client after a successful Google Sign-In. This token contains the user's information and is used to verify the user's identity on the server side.
  const ticket = await client.verifyIdToken({
    idToken: tokenId,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const {email_verified, name, email, sub: googleId } = ticket.getPayload(); //sub is the unique identifier for the user provided by Google, which we will use to link the Google account to our user model. We also check if the email is verified to ensure that we only allow authenticated users to log in or register.
  if (!email_verified) {
    res.status(400);
    throw new Error('Google email not verified');
  }
  let user = await User.findOne({ email });
  if (user) {
    if (!user.googleId) {
      user.googleId = googleId; // Link the existing account with Google ID if not already linked
      await user.save();
    }
  } else {
    user = await User.create({
      name,
      email,
      googleId,
      password:""
    });
  }
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    preferredRole: user.preferredRole,
    token: generateToken(user),
  });
}
);

const getUserProfile = asyncHandler(async (req, res) => {
  if(req.user){
    res.status(200).json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      preferredRole: req.user.preferredRole,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.preferredRole=req.body.preferredRole || user.preferredRole;
    if(req.body.password){
      user.password = req.body.password; // The password will be hashed in the pre-save middleware of the User model before saving to the database.
    }
    await user.save();
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      preferredRole: user.preferredRole,
      token: generateToken(user), // Generate a new token in case the user's information has changed, which may affect the token's payload.
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export { registerUser, loginUser, googleAuth, getUserProfile, updateUserProfile }; // Export the controller functions to be used in the user routes for handling user-related requests
