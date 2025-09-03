import UserModel from "../models/userModel.js";
import { signUpSchema, signInSchema} from "../middlewares/validators.js";
import doHash, { decryptHashedPassword } from "../utilities/hashing.js";

import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import crypto from 'crypto';

dotenv.config();


export const signUp = async (req, res) => {
    const { email, password, user_type= "mentee" } = req.body;
    try {
        // Validate input
        const { error } = signUpSchema.validate({ email, password });
        if (error) {
            return res.status(400).json({
                field: error.details[0].context.key,
                success: false,
                message: error.details[0].message
            });
        }

        // Check if email already exists
        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                field: 'email',
                success: false,
                message: "Email already exists, try a different one."
            });
        }
        
        // Hash the password
        const hashedPassword = await doHash(password, 12);
        // Create new user
        const newUser = new UserModel({ email, password: hashedPassword, provider: 'local', user_type: user_type });
        const result = await newUser.save();

        result.password = undefined;
        const accessToken = jwt.sign(
            {
                userId: newUser._id,
                email: newUser.email,
                user_type: newUser.user_type          
            },
            process.env.SECRET_ACCESS_TOKEN,
            { expiresIn: "0.5h" }
        );
        console.log(newUser);
       
        // Step 6: Set cookie & return response
        return res.cookie("accessToken", accessToken, {
                httpOnly: true,
                sameSite: "strict",
                maxAge: 3 * 60 * 60 * 1000, // 3 hours
                secure: process.env.NODE_ENV === "production" // make sure HTTPS is used in prod
            })
            .json({
                success: true,
                field: null,
                message: "🎉 Your account has been created successfully",
                user: newUser._id,
                user_type: newUser.user_type
            })
            
            // Used for when you use localStorage in the client-side 
            // instead of cookie-based flow or auth
            /**
            .status(201).json({
                success: true,
                field: null,
                message: "🎉 Your account has been created successfully",
                result
            }) */
           ;
          
    } catch (error) {
        console.error("SignUp Error:", error);
        return res.status(500).json({
            field: null,
            success: false,
            message: "Internal server error. Please try again later."
        });
    }
};
export default signUp;


export const signUpAsMentor = async (req, res) => {
    const { email, password, user_type= "mentor" } = req.body;

    try {
        // Validate input
        const { error } = signUpSchema.validate({ email, password });
        if (error) {
            return res.status(400).json({
                field: error.details[0].context.key,
                success: false,
                message: error.details[0].message
            });
        }

        // Check if email already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                field: 'email',
                success: false,
                message: "Email already exists, try a different one."
            });
        }

        // Hash the password
        const hashedPassword = await doHash(password, 12);
        // Create new user
        const newUser = new UserModel({ user_type, email, password: hashedPassword, provider: 'local' });
        const result = await newUser.save();

        result.password = undefined;
        const accessToken = jwt.sign(
            {
                userId: newUser._id,
                email: newUser.email,
                user_type: newUser.user_type          
            },
            process.env.SECRET_ACCESS_TOKEN,
            { expiresIn: "0.5h" }
        );
        console.log(newUser);
        
        // Step 6: Set cookie & return response
        return res.cookie("accessToken", accessToken, {
                httpOnly: true,
                sameSite: "strict",
                maxAge: 3 * 60 * 60 * 1000, // 3 hours
                secure: process.env.NODE_ENV === "production" // make sure HTTPS is used in prod
            })
            .json({
                success: true,
                field: null,
                message: "🎉 Your account has been created successfully",
                user: newUser._id,
                user_type: newUser.user_type
            })
            
            // Used for when you use localStorage in the client-side 
            // instead of cookie-based flow or auth
            /**
            .status(201).json({
                success: true,
                field: null,
                message: "🎉 Your account has been created successfully",
                result
            }) */
           ;// 
           
    } catch (error) {
        console.error("SignUp Error:", error);
        return res.status(500).json({
            field: null,
            success: false,
            message: "Internal server error. Please try again later."
        });
    }
};


export function isUserloggedIn (req, res) {
  res.status(200).json({
    success: true,
    user: {
      id: req.user.userId,
      email: req.user.email,
      verified: req.user.verified
    }
  })
}


// OAuth callback handler (Google/GitHub)
export const oauthCallbackHandler = async (req, res) => {
  const { id, email, name, provider, user_type = "mentee" } = req.user;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: "Email not found in OAuth profile" });
    }

    let existingUser = await UserModel.findOne({ email });

    if (!existingUser) {
      existingUser = await UserModel.create({
        email,
        name,
        provider,
        oauthId: id,
        user_type, // ✅ now respected
        password: crypto.randomBytes(16).toString("hex"),
      });
    } else if (existingUser.user_type !== user_type) {
      existingUser.user_type = user_type;
      await existingUser.save();
    }

    const accessToken = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        user_type: existingUser.user_type
      },
      process.env.SECRET_ACCESS_TOKEN,
      { expiresIn: "6h" }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 6 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production"
    }).redirect("http://localhost:3000/AUTH_MICROSERVICE/signin");

  } catch (error) {
    console.log("OAuth error:", error.message);
    res.status(500).json({ message: "OAuth Login failed." });
  }
};


export const oauthCallbackHandlerForSignUpMentor = async (req, res) => {
  const { id, email, name, provider, user_type = "mentor" } = req.user;

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email not found in OAuth profile"
      });
    }

    let existingUser = await UserModel.findOne({ email });

    if (!existingUser) {
      existingUser = await UserModel.create({
        email,
        name,
        provider,
        oauthId: id,
        user_type, // 👈 mentee or mentor
        password: crypto.randomBytes(16).toString("hex"),
      });
    } else if (existingUser.user_type !== user_type) {
      existingUser.user_type = user_type; // 👈 Promote or switch type
      await existingUser.save();
    }

    const accessToken = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        user_type: existingUser.user_type
      },
      process.env.SECRET_ACCESS_TOKEN,
      { expiresIn: "6h" }
    );

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 6 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === "production"
      })
      .redirect("http://localhost:3000/AUTH_MICROSERVICE/signin");

  } catch (error) {
    console.log("OAuth error:", error.message);
    res.status(500).json({
      message: "OAuth Login failed."
    });
  }
};


export async function signIn(req, res) {
  const { email, password } = req.body;

  try {
    // Step 1: Validate input
    const { error } = signInSchema.validate({ email, password });
    if (error) {
      return res.status(400).json({
        success: false,
        field: error.details[0].context.key,
        message: error.details[0].message,
      });
    }

    // Step 2: Find user
    const existingUser = await UserModel.findOne({ email }).select("+password");
    if (!existingUser) {
      return res.status(401).json({
        success: false,
        field: "email",
        message: "User doesn't exist. Please sign up.",
      });
    }

    // Step 3: Check password
    const isPasswordValid = await decryptHashedPassword(password, existingUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        field: "password",
        message: "Invalid password",
      });
    }

    // Step 4: Generate tokens
    const accessToken = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        user_type: existingUser.user_type,
        verified: existingUser.verified,
      },
      process.env.SECRET_ACCESS_TOKEN,
      { expiresIn: "30m" } // short-lived
    );

    const refreshToken = jwt.sign(
      { userId: existingUser._id },
      process.env.SECRET_REFRESH_TOKEN,
      { expiresIn: "7d" } // long-lived
    );

    // Step 5: Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 60 * 1000, // 30 min
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Step 6: Send response
    res.json({
      success: true,
      message: "Logged in successfully",
      accessToken: accessToken,
      userId: existingUser._id,
      user_type: existingUser.user_type,
      email: existingUser.email, 
    });

    console.log(
      `\nUser: ${existingUser._id}\nAccessToken: ${accessToken}\nRefreshToken: ${refreshToken}\nType: ${existingUser.user_type}`
    );
  } catch (error) {
    console.error("SignIn Error:", error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error}`,
    });
  }
}

export async function refreshTokenHandler(req, res) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    // Verify refresh token
    const payload = jwt.verify(token, process.env.SECRET_REFRESH_TOKEN);

    // Fetch user
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Create new access token
    const newAccessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        user_type: user.user_type,
        verified: user.verified,
      },
      process.env.SECRET_ACCESS_TOKEN,
      { expiresIn: "30m" }
    );

    // Set new cookie
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    return res.json({
      success: true,
      message: "Access token refreshed",
    });
  } catch (error) {
    console.error("Refresh Token Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
}

export async function signOut(req, res) {
    res.clearCookie("accessToken", "refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    }).clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    })//.redirect("http://localhost:3000/AUTH_MICROSERVICE/signup");

    
  
    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
}