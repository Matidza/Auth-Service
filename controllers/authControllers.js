import UserModel from "../models/userModel.js";
import { signUpSchema, signInSchema } from "../middlewares/validators.js";
import doHash, { decryptHashedPassword } from "../utilities/hashing.js";
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";

dotenv.config();

/**
 * Sign up a new user
 * 
 * This function registers a new user by validating input, checking for duplicates,
 * hashing the password, and storing the user in the database.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const signUp = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Step 1: Validate input using Joi schema
        const { error } = signUpSchema.validate({ email, password });
        if (error) {
            return res.status(401).json({
                success: false,
                message: error.details[0].message // Return validation error message
            });
        }

        // Step 2: Check if the email already exists in the database
        const existingUser = await UserModel.findOne({ email, password }); // password should not be in this query
        if (existingUser) {
            return res.status(401).json({
                success: false,
                message: "Email already exists, use something else!"
            });
        }

        // Step 3: Hash the password using a secure algorithm
        const hashedPassword = await doHash(password, 12); // doHash is assumed to be a bcrypt wrapper

        // Step 4 (optional): You could generate access & refresh tokens here if needed
        /*
        const userTokenValue = jwt.sign({
            id: newUser._id,
            email: newUser.email
        }, process.env.ACCESS_TOKEN, { expiresIn: '3h' });
        */

        // Step 5: Save the new user to the database
        const newUser = new UserModel({
            email,
            password: hashedPassword
        });

        const result = await newUser.save();

        // Step 6: Remove password from response for security
        result.password = undefined;

        // Step 7: Return success response
        res.status(201).json({
            success: true,
            message: "Your account has been created successfully",
            result
        });

    } catch (error) {
        console.error("SignUp Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export default signUp;





/**
 * Sign in a user
 * 
 * This function authenticates a user by validating their credentials,
 * checking if they exist, verifying their password, and issuing a JWT token.
 * The token is stored in a cookie to manage session state.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function signIn(req, res) {
    const { email, password } = req.body;

    try {
        // Step 1: Validate input using Joi schema
        const { error } = signInSchema.validate({ email, password });
        if (error) {
            return res.status(401).json({
                success: false,
                message: error.details[0].message // Return the first validation error
            });
        }

        // Step 2: Check if user exists in the database by email
        const existingUser = await UserModel.findOne({ email }).select("+password");
        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "User doesn't exist"
            });
        }

        // Step 3: Compare entered password with stored hashed password
        const isPasswordValid = await decryptHashedPassword(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials!" // Password mismatch
            });
        }

        // Step 4: Generate JWT access token
        const token = jwt.sign(
            {
                userId: existingUser._id,
                email: existingUser.email,
                verified: existingUser.verified
            },
            process.env.ACCESS_TOKEN, // Secret key
            { expiresIn: "3h" } // Token expires in 3 hours
        );

        // Step 5: Set a cookie in the client’s browser with the token
        res.cookie("Authorization", `Bearer ${token}`, {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day expiration
            httpOnly: process.env.NODE_ENV === "production", // Restrict access from client-side JS
            secure: process.env.NODE_ENV === "production" // Use HTTPS in production
        }).json({
            success: true,
            token, // Return token in response body as well
            message: "Logged in successfully"
        });

    } catch (error) {
        // Log and handle unexpected server error
        console.error("SignIn Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}


/**
 * Sign out a user
 * 
 * This function clears the authentication cookie from the user's browser,
 * effectively logging them out by removing the stored JWT token.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function signOut(req, res) {
    // Clear the "Authorization" cookie to log the user out
    res.clearCookie("Authorization", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    }).status(200).json({
        success: true,
        message: "Logged out successfully"
    });

    // Note: Since JWTs are stateless, there's nothing to "delete" on the server unless using a token blacklist
}



export async function forgotPassword(req, res) {
    const {email} = req.body;

}