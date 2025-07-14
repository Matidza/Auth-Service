import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authroutesRoutes, { data } from './routes/authRoutes.js';
import postsRoutes from './routes/postsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// ✅ Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests only from frontend
  credentials: true               // Enable cookies and credentials
}));

app.use(helmet());               // Adds security headers
app.use(cookieParser());         // Parses cookies from the client
app.use(express.json());         // Parses incoming JSON
app.use(express.urlencoded({ extended: true })); // Parses form data

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB!");
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
  });

// ✅ Routes
app.use('/api/auth', authroutesRoutes);
app.use('/api/auth', postsRoutes); // Consider changing prefix if not strictly auth-related

// ✅ Root route for test/demo
app.get('/', data);

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("\n🔥 Error occurred:", err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Something went wrong on the server",
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
  });
});

// ✅ Server Start
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}\n`);
});
