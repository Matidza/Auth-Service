import express from "express";
import signUp, { forgotPassword, resetPassword, signIn, signOut } from "../controllers/authControllers.js";
import catchAsync from '../utilities/catchAsync.js';

const router = express.Router();

//Routes will be Implemented here
router.post('/', catchAsync(signUp))
router.post('/signin', catchAsync(signIn))
router.post('/signout', catchAsync(signOut))
router.patch('/forgot-password', catchAsync(forgotPassword))
router.patch('/reset-password', catchAsync(resetPassword))

export default router