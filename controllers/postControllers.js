//import { populate } from "dotenv";
import { createPostSchema } from "../middlewares/validators.js";
import PostModel from "../models/postModel.js";

export async function getAllPosts(req, res) {
    const {page} = req.query
    const postsPerPage = 10;
    try {
        let pageNumber = 0;
        if (page <= 1) {
            pageNumber = 0
        }else {
            pageNumber = page - 1
        }

        const result = await PostModel.find()
            .sort({createdAt: -1})
            .skip(pageNumber * postsPerPage)
            .limit(postsPerPage)
            .populate({
                path: "userId",
                select: "email"
            })

        res.status(200).json({
            success: true,
            message: "post",
            data: result
        })
    } catch(error) {
        console.log(error)
    }
}


// Create a Post
export async function createPost(req, res) {
    const {title, description} = req.body;
    const {userId} = req.user;

    try {
        const {value, error} = createPostSchema.validate({
            title,
            description,
            userId
        })

        if (error) {
            return res.status(400).json({
                
                success: false,
                message: error.details[0].message
            });
        }
        const result =  await PostModel.create({title, description, userId})
        
        res.status(201).json({
            success: true,
            message: "post created",
            data: result,
            
        })
    } catch (error) {
        console.log(error)
    }
}

// Single Route
export async function individualPost(req, res) {
    const {_Id} = req.query
    try {
        const existingPost = await PostModel.findOne({_Id})
            .populate({
                path: "userId",
                select: "email"
            })

        if (!existingPost) {
            return res.status(400).json({
                success: false,
                message: "Post is unavailable"
            });
        }

        res.status(200).json({
            success: true,
            message: "single post",
            data: existingPost
        })
    } catch(error) {
        console.log(error)
    }
}


export async function updatePost(req, res) {
    const {_Id} = req.query
    const {title, description} = req.body;
    const {userId} = req.user;

    try {
        const {value, error} = createPostSchema.validate({
            title,
            description,
            userId
        })

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }
        const existingPost = await PostModel.findOne({_Id})

        if (!existingPost) {
            return res.status(404).json({
                success: false,
                message: "Post doesn't exist"
            });
        }

        if (existingPost.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }
        existingPost.title = title;
        existingPost.description = description
        const result =  await existingPost.save()
        
        res.status(201).json({
            success: true,
            message: "post updateted",
            data: result,
            
        })
    } catch (error) {
        console.log(error)
    }
}


export async function deletePost(req, res) {
    const {_Id} = req.query
    const {userId} = req.user;

    try {
        const existingPost = await PostModel.findOne({_Id})
        if (!existingPost) {
            return res.status(404).json({
                success: false,
                message: "Post already unavailable"
            });
        }

        if (existingPost.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }
        await PostModel.deleteOne({_Id})
        
        res.status(201).json({
            success: true,
            message: "post deleted",
        })
    } catch (error) {
        console.log(error)
    }
}