import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import authroutesRoutes, { data } from './routes/authRoutes.js'
import postsRoutes from './routes/postsRoutes.js'

import dotenv from 'dotenv';
dotenv.config();


const app = express();
const PORT = 8000

app.use(cors({
    origin: 'http://localhost:3000', // allow only this origin
   //methods: ['POST', 'GET', 'PUT', 'DELETE'],
    credentials: true // if you're using cookies/auth
}));

app.use(helmet())
app.use(cookieParser())
app.use(express.json())

app.use(express.urlencoded({extended:true}))

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("connecting to database...")
    console.log("database connected!")
}).catch( err => {
    console.log(err);
})


//Routes
app.use('/api/auth', authroutesRoutes)
app.use('/api/auth', postsRoutes)

// Global error handler middleware
app.use((err, req, res, next) => {
    console.error("\n🔥 Error occurred:", err);

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Something went wrong on the server",
        stack: process.env.NODE_ENV !== "production" ? err.stack : undefined
    });
});

//Routes will be Implemented here
app.get('/', data)

app.listen(PORT, () => { //process.env.PORT
    console.log(`\nServer running on port: http://localhost:${PORT}\n`)
    //console.log("connecting to database...")
})
















































/**

 import express from 'express';
 import mongoose from 'mongoose';
 import cors from 'cors';
 import helmet from 'helmet';
 import cookieParser from 'cookie-parser';
 import dotenv from 'dotenv';
 import authRoutes, { data } from './routes/authRoutes.js';
 dotenv.config();
 const app = express();
 const PORT = process.env.PORT || 8000;
 // Middlewares
 app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
 }));
 app.use(helmet());
 app.use(cookieParser());
 app.use(express.json());
 app.use(express.urlencoded({ extended: true }));
 // Database connection
 mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
 })
 .then(() => console.log(" Database connected!"))
 .catch(err => console.error(" DB Connection Error:", err));
 // Routes
 app.use('/api/auth', authRoutes);
 app.get('/', data);
 // Global error handler
 app.use((err, req, res, next) => {
  console.error("-> Global Error Handler:", err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Something went wrong on the server",
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined
  });
 });
 // Start server
 app.listen(PORT, () => {
  console.log(` Server running on: http://localhost:${PORT}`);
 });

 */