import UserModel from "../models/userModel";
import signUpSchema from "../middlewares/validators";
import bcrypt from 'bcrypt';
import jsonwebtoken from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';

 export const signUpUsers = async (req,res) => {
    const {email, password} = req.body;
    try {
        // Check if user has entered their email and password
        const {error , value} = signUpSchema.validate({email, password})
        if (error) {
            return res.status(401).json({
                success: false,
                message: error.details[0].message
            })
        }
        // check if email already exists
        const existingUser = await UserModel.findOne({email, password})
        if (existingUser) {
            return res.status(401).json({
                success: false,
                message: "Email already exists, use something else!"
            })
        }
        // hash password before submission
        const salt = bcrypt.genSaltSync(10)
        password = bcrypt.hashSync(password, salt)

        // generate access and refresh token

        // add new User
        const newUser = new UserModel({email, password:password})

        const result = await newUser.save();
        result.password = undefined;

        res.status(201).json({
            success: true,
            message: "Your account has been created successfully",
            result
        })

    }catch (error) {
        console.log(error)
    }
};

export const logInUser = async (req,res) => {
    console.log("Login Page")
    res.send("Welcome to Login Login Page")
}


