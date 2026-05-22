import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {//the person with bearer is authenticated user
    try {
      token = req.headers.authorization.split(' ')[1]; // Extract the token from the "Bearer <token>" format
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token using the secret key
      req.user = await User.findById(decoded.id).select('-password'); // Find the user by ID and exclude the password field
      next(); // Move to the next middleware or route handler
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

export { protect };f