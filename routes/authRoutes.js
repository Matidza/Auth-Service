import express from "express";
import signUp, { 
    changePassword, isUserloggedIn, sendForgotPasswordCode, sendVarificationCode, 
    signIn, signOut, verifysendForgotPasswordCode, verifyVarificationCode 
} from "../controllers/authControllers.js";

import catchAsync from '../utilities/catchAsync.js';
import { identifier } from "../middlewares/identifier.js";
import UserModel from "../models/userModel.js";

import passport from "passport";
import { oauthCallbackHandler } from "../controllers/authControllers.js";
import '../auth/passportConfig.js'



const router = express.Router();

export async function data(req, res)  {
    const users = await UserModel.find()
    let allData = users.map((user) => {
        return user
    })

    res.send(allData)
}
//Routes will be Implemented here

// Auth
router.post('/signup', catchAsync(signUp))
router.post('/signin', catchAsync(signIn))
router.post('/signout', identifier, catchAsync(signOut))

// Verify New users
router.patch('/send-verification-code',  catchAsync(sendVarificationCode))
router.patch('/verify-verification-code',  catchAsync(verifyVarificationCode))

// Password related Stuff
router.patch('/change-password', identifier, catchAsync(changePassword))
router.patch('/forgot-password',  catchAsync(sendForgotPasswordCode))
router.patch('/reset-password', catchAsync(verifysendForgotPasswordCode))


// check if User is Logged In?
router.get('/check-auth', identifier, catchAsync(isUserloggedIn));

// SignUp Users with Google and Github
router.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}));
router.get('/google/callback', passport.authenticate('google', {session: false}), oauthCallbackHandler )

router.get('/github', passport.authenticate('github', {scope: ['user: email']}));
router.get('/github/callback', passport.authenticate('github', {session: false}), oauthCallbackHandler )

export default router