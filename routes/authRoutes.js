// External modules
import express from "express";
import passport from "passport";

// Internal modules
import '../auth/passportConfig.js';
import catchAsync from '../utilities/catchAsync.js';
import { identifier } from "../middlewares/identifier.js";
import UserModel from "../models/userModel.js";
import {
  signUp,
  signUpAsMentor,
  signIn,
  signOut,
  changePassword,
  isUserloggedIn,
  sendForgotPasswordCode,
  verifysendForgotPasswordCode,
  sendVarificationCode,
  verifyVarificationCode,
  oauthCallbackHandler,
  oauthCallbackHandlerForSignUpMentor
} from "../controllers/authControllers.js";

const router = express.Router();

/**
 * Test route: returns all user data (for development/testing only).
 */
export async function data(req, res) {
  const users = await UserModel.find();
  const allData = users.map(user => user);
  res.send(allData);
}

// ===========================
// 🔐 AUTHENTICATION ROUTES
// ===========================

// Sign Up & Sign In
router.post('/signup', catchAsync(signUp));
router.post('/signup-as-mentor', catchAsync(signUpAsMentor));
router.post('/signin', catchAsync(signIn));
router.post('/signout', identifier, catchAsync(signOut));

// ===========================
// ✅ EMAIL VERIFICATION
// ===========================

// Send and verify verification code (for new users)
router.patch('/send-verification-code', catchAsync(sendVarificationCode));
router.patch('/verify-verification-code', catchAsync(verifyVarificationCode));

// ===========================
// 🔑 PASSWORD MANAGEMENT
// ===========================

// Change password (requires login)
router.patch('/change-password', identifier, catchAsync(changePassword));

// Forgot and reset password flow
router.patch('/forgot-password', catchAsync(sendForgotPasswordCode));
router.patch('/reset-password', catchAsync(verifysendForgotPasswordCode));

// ===========================
// 🧾 SESSION VALIDATION
// ===========================

// Check if user is currently authenticated
router.get('/check-auth', identifier, catchAsync(isUserloggedIn));

// ===========================
// 🌐 OAUTH SOCIAL LOGIN
// ===========================

// Google OAuth
// For mentee signup
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account',
  state: 'mentee'
}));
router.get('/google/callback', passport.authenticate('google', { session: false }), oauthCallbackHandler);

// Google Auth Mentor
// For mentor signup
router.get('/google-mentor', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account',
  state: 'mentor'
}));
router.get('/google/callback', passport.authenticate('google', { session: false }), oauthCallbackHandlerForSignUpMentor);



// GitHub OAuth
router.get('/github', passport.authenticate('github', { 
  scope: ['user:email'],
  state: 'mentee'
}));
router.get('/github/callback', passport.authenticate('github', { session: false }), oauthCallbackHandler);

// GitHub OAuth
router.get('/github-mentor', passport.authenticate('github', {
  scope: ['user:email'],
  state: 'mentor'  // ✅ mark it as mentor signup
}));

router.get('/github/callback', passport.authenticate('github', { session: false }), oauthCallbackHandlerForSignUpMentor);


// LinkedIn OAuth
// 👤 Default signup (mentee)
router.get('/linkedin', passport.authenticate('linkedin', {
  state: 'mentee' // 🔐 passed to strategy
}));
router.get('/linkedin/callback', passport.authenticate('linkedin', { session: false }), oauthCallbackHandler);


// 👨‍🏫 Mentor signup
router.get('/linkedin-mentor', passport.authenticate('linkedin', {
  state: 'mentor' // 🔐 passed to strategy
}));
router.get('/linkedin/callback', passport.authenticate('linkedin', { session: false }), oauthCallbackHandlerForSignUpMentor);


export default router;
