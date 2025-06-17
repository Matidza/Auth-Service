import express from "express";
import signUp, { 
    changePassword, forgotPassword, 
    resetPassword, sendVarificationCode, 
    signIn, signOut, verifyVarificationCode 
} from "../controllers/authControllers.js";

import catchAsync from '../utilities/catchAsync.js';
import { identifier } from "../middlewares/identifier.js";

const router = express.Router();

//Routes will be Implemented here
router.post('/signup', catchAsync(signUp))
router.post('/signin', catchAsync(signIn))
router.post('/signout', identifier, catchAsync(signOut))
router.patch('/send-verification-code', identifier, catchAsync(sendVarificationCode))
router.patch('/verify-verification-code', identifier, catchAsync(verifyVarificationCode))

router.patch('/change-password', identifier, catchAsync(changePassword))
router.patch('/forgot-password', identifier, catchAsync(forgotPassword))
router.patch('/reset-password', identifier, catchAsync(resetPassword))

export default router