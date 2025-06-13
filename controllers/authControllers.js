import UserModel from "../models/userModel.js";
import { signUpSchema, signInSchema, acceptedCodeSchema } from "../middlewares/validators.js";
import doHash, { decryptHashedPassword, hmacProcess } from "../utilities/hashing.js";

import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import sendEmail from "../middlewares/sendEmail.js";



dotenv.config();
/**
 * Sign up a new user 
 * This function registers a new user by validating input, checking for duplicates,
 * hashing the password, and storing the user in the database.
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

    } 
    catch (error) {
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
 * This function authenticates a user by validating their credentials,
 * checking if they exist, verifying their password, and issuing a JWT token.
 * The token is stored in a cookie to manage session state.
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

        // Step 4: Generate Access Token (short-lived) and Refresh Token (long-lived)
        const accessToken = jwt.sign(
            {
                userId: existingUser._id,
                email: existingUser.email,
                verified: existingUser.verified
            },
            process.env.ACCESS_TOKEN, // Secret for access tokens
            { expiresIn: "3h" }
        );

        const refreshToken = jwt.sign(
            { userId: existingUser._id },
            process.env.REFRESH_TOKEN, // Secret for refresh tokens
            { expiresIn: "1d" } // 1 day expiry
        );

        // Step 5: Set cookies
        res
            .cookie("Authorization", `Bearer ${accessToken}`, {
                expires: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3h
                httpOnly: process.env.NODE_ENV === "production",
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict"
            })
            .cookie("RefreshToken", refreshToken, {
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict"
            })
            .json({
                success: true,
                refreshToken: refreshToken,
                accessToken: accessToken,
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
 * This function clears the authentication cookie from the user's browser,
 * effectively logging them out by removing the stored JWT token.
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
    try {
        const existingUser = await UserModel.findOne({email})
        // Check if user exists
        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "User doesn't exist"
            });
        }
        // check if user is verified
        if (existingUser.verified) {
            return res.status(401).json({
                success: false,
                message: "User is already verified"
            });
        }
        // Generate reset password code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // ensures 6 digits

        // Send email to user
        let sendingEmail = await sendEmail.sendMail({
            from: process.env.EMAIL_ADDRESS,
            to: existingUser.email,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #333;">Password Reset Code</h2>
                    <p>Hello ${existingUser.email || ''},</p>
                    <p>We received a request to reset your password. Use the code below to proceed with resetting your password:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; color: #4CAF50;">${resetCode}</span>
                    </div>
                    <p><strong>Note:</strong> This code will expire in 5 minutes for security reasons. If you did not request a password reset, please ignore this email or contact support immediately.</p>
                    <p>Thank you,<br/>The Support Team</p>
                </div>
            `
        });


        if (sendingEmail.accepted[0] === existingUser.email ) {
            const hashedValue = hmacProcess(resetCode, process.env.HMAC_VERIFICATION_CODE_SECRET)
            existingUser.verificationCode = hashedValue;
            existingUser.verificationCodeValidation = Date.now();

            await existingUser.save()
            return res.status(200).json({
                success: true,
                message: "Code sent to your email"
            })
        }

        res.status(400).json({
            success: false,
            message: "Code sent failed"
        });
        console.log(sendingEmail)

    }catch (error) {
        console.log(error)
    }
}


const acceptedCodeSchema = Joi.object({
    email: Joi.string().min(5).max(60).required().email({
        tlds: { allow: false },
    }),
    providedCodeValue: Joi.number().required()
});

export async function resetPassword(req, res) {
    let { email, providedCodeValue } = req.body;
    try {
        const { error } = acceptedCodeSchema.validate({ email, providedCodeValue });
        if (error) {
            return res.status(401).json({
                success: false,
                message: error.details[0].message
            });
        }

        providedCodeValue = providedCodeValue.toString();
        const existingUser = await UserModel.findOne({ email }).select('+verificationCode +verificationCodeValidation');

        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "User doesn't exist"
            });
        }

        if (existingUser.verified) {
            return res.status(401).json({
                success: false,
                message: "User is already verified"
            });
        }

        // Check if code has expired
        if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
            return res.status(401).json({
                success: false,
                message: "Code has expired!"
            });
        }

        const hashedCodeValue = hmacProcess(providedCodeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);

        if (hashedCodeValue === existingUser.verificationCode) {
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;
            await existingUser.save();

            return res.status(200).json({
                success: true,
                message: "Code verified successfully"
            });
        }

        return res.status(400).json({
            success: false,
            message: "Invalid code"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}
