import express from "express";
import catchAsync from '../utilities/catchAsync.js';
import { identifier } from "../middlewares/identifier.js";
import { createPost, deletePost, getAllPosts, individualPost, updatePost } from "../controllers/postControllers.js";
//import catchAsync from '../utilities/catchAsync.js';
const router = express.Router();

router.get('/all-posts', getAllPosts)
router.post('/create-post', identifier, catchAsync(createPost))
router.get('/single-page', identifier, catchAsync(individualPost))
// Verify New users

router.put('/update-post', identifier, catchAsync(updatePost))
router.delete('/delete-post', identifier, catchAsync(deletePost))
export default router