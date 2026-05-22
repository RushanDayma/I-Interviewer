import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

import { Server } from 'socket.io';
import connectDB from './config/db.js';
// import userRoutes from './routes/userRoutes.js';
// import sessionRoutes from './routes/sessionRoutes.js';

import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();
// connectDB();

const app = express();

const server = http.createServer(app); //lets the same server handle both http and websocket requests

const allowOrigin = [
  'http://localhost:5174',
  'http://localhost:5173'
];

const io = new Server(server, {
  cors: {
    origin: allowOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
  },
});

//for mobile apps or curl requests that don't have an origin, we allow them by default. For web requests, we check if the origin is in our allow list. In production, we allow all origins to avoid issues with different deployment environments. In development, we restrict to the specified origins for better security.
app.use(cors({
  origin:(origin, callback) => {
    if (!origin) return callback(null, true); // Allow requests with no origin (like mobile apps or curl)
    if (allowOrigin.includes(origin)) {
       callback(null, true);
    } else {
      if (process.env.NODE_ENV === 'production') {
        return callback(null, true); // Allow all origins in production
      }
      else{
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  origin: allowOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization','X-Requested-With'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('io', io); // Make the io instance available in routes via req.app.get('io')

app.get('/', (req, res) => {
  res.send('API is running...');
});

// app.use('/api/users', userRoutes);
// app.use('/api/sessions', sessionRoutes);

io.on('connection', (socket) => { //this creates a private room for each user based on their user ID, allowing us to send messages directly to that user without affecting others. This is useful for notifications, private messages, or any user-specific updates.
  console.log('A user connected: ' + socket.id);
  const UserId = socket.handshake.query.userId; // Get the user ID from the query parameters when the client connects 
  if (UserId){
    socket.join(UserId); // Join a room with the user's ID
    console.log(`User ID ${UserId} connected with socket ID ${socket.id}`);
  }
  
  socket.join(UserId); // Join a room with the user's ID and (Global)used for broadcasting.

  socket.on('disconnect', () => {
    console.log('A user disconnected: ' + socket.id);
  });
});


app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000; // In production, the PORT environment variable will be set by the hosting provider. In development, it defaults to 5000.

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
});