import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import authroutesRoutes from './routes/authRoutes.js'

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
    console.log("database connected...")
}).catch( err => {
    console.log(err);
})

//Routes
app.use('/api/auth', authroutesRoutes)

app.listen(PORT, () => { //process.env.PORT
    console.log(`\nServer running on port: http://localhost:${PORT}\n`)
})
