import express from "express";
import { signUpUsers, logInUser } from "../controllers/authControllers";

export const router = express.Router()

//Routes will be Implemented here
// Register Page
router.post('/', signUpUsers)

// Login User
router.post('/login',  )


// Forgot Password Page
router.post('/forgot-password', (req,res) => {
    console.log("fotgot password Page")
    res.send("Welcome to Forgot password Page")
})


// Reset Password page
router.post('/reset-password', (req, res) => {
    console.log("reset Page")
    res.send("Welcome to Reset password Page")
})
