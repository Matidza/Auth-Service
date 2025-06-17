import express from "express";
import signUp, { 
    changePassword, sendVarificationCode, 
    signIn, signOut, verifyVarificationCode 
} from "../controllers/authControllers.js";

import catchAsync from '../utilities/catchAsync.js';
import { identifier } from "../middlewares/identifier.js";

const router = express.Router();

//Routes will be Implemented here
router.post('/signup', catchAsync(signUp))
router.post('/signin', catchAsync(signIn))
router.post('/signout',  catchAsync(signOut))
router.patch('/send-verification-code', catchAsync(sendVarificationCode))
router.patch('/verify-verification-code', catchAsync(verifyVarificationCode))

router.patch('/change-password',  catchAsync(changePassword))
router.patch('/forgot-password',  catchAsync())
router.patch('/reset-password',  catchAsync())


export default router