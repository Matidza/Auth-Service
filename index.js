import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import authroutesRoutes, { data } from './routes/authRoutes.js'

import dotenv from 'dotenv';
dotenv.config();


const app = express();
const PORT = 8000
app.use(cors())
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
    console.log("connecting to database...")
})
