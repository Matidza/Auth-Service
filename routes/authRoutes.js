import express from "express";
import signUp, { forgotPassword, signIn, signOut } from "../controllers/authControllers.js";


const router = express.Router();

//Routes will be Implemented here
// Register Page
router.post('/', signUp)
router.post('/signin', signIn)
router.post('/signout', signOut)
router.patch('/forgot-password', forgotPassword)

export default router