import express from "express";
import signUp, { 
    changePassword, sendForgotPasswordCode, sendVarificationCode, 
    signIn, signOut, verifysendForgotPasswordCode, verifyVarificationCode 
} from "../controllers/authControllers.js";

import catchAsync from '../utilities/catchAsync.js';
import { identifier } from "../middlewares/identifier.js";
import UserModel from "../models/userModel.js";

const router = express.Router();

export async function data(req, res)  {
    const users = await UserModel.find()
    let allData = users.map((user) => {
        return user
    })

    res.send(allData)
}
//Routes will be Implemented here

router.post('/signup', catchAsync(signUp))
router.post('/signin', catchAsync(signIn))
router.post('/signout', identifier, catchAsync(signOut))
router.patch('/send-verification-code',  catchAsync(sendVarificationCode))
router.patch('/verify-verification-code',  catchAsync(verifyVarificationCode))

router.patch('/change-password', identifier, catchAsync(changePassword))
router.patch('/forgot-password',  catchAsync(sendForgotPasswordCode))
router.patch('/reset-password', catchAsync(verifysendForgotPasswordCode))

router.get('/check-auth', identifier, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user.userId,
      email: req.user.email,
      verified: req.user.verified
    }
  });
});


export default router