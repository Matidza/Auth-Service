import UserModel from "../models/userModel.js";
import { signUpSchema, signInSchema, 
    acceptedCodeSchema, changePasswordSchema, 
    acceptForgotPasswordSchema, sendCodeSchema } from "../middlewares/validators.js";
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
export const signUp = async (req, res) => {
    const { email, password } = req.body;

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
        const newUser = new UserModel({ email, password: hashedPassword });
        const result = await newUser.save();

        result.password = undefined;

        return res.status(201).json({
            success: true,
            field: null,
            message: "🎉 Your account has been created successfully",
            result
        });

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


/**
 * Sign in a user
 * This function authenticates a user by validating their credentials,
 * checking if they exist, verifying their password, and issuing a JWT token.
 * The token is stored in a cookie to manage session state.
 */
export async function signIn(req, res) {
    const { email, password } = req.body;

    try {
        // Step 1: Validate input
        const { error } = signInSchema.validate({ email, password });
        if (error) {
            return res.status(400).json({
                success: false,
                field: error.details[0].context.key,
                message: error.details[0].message
            });
        }

        // Step 2: Find user
        const existingUser = await UserModel.findOne({ email }).select("+password");
        if (!existingUser) {
            return res.status(401).json({
                success: false,
                field: 'email',
                message: "User doesn't exist. Please sign up."
            });
        }

        // Step 3: Optional verification check
        /** 
        if (!existingUser.verified) {
            return res.status(403).json({
                success: false,
                field: 'email',
                message: "Your account is not verified. Please check your email."
            });
        }*/

        // Step 4: Check password
        const isPasswordValid = await decryptHashedPassword(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                field: 'password',
                message: "Invalid password"
            });
        }

        // Step 5: Generate access token
        const accessToken = jwt.sign(
            {
                userId: existingUser._id,
                email: existingUser.email,
                verified: existingUser.verified
            },
            process.env.SECRET_ACCESS_TOKEN,
            { expiresIn: "0.5h" }
        );

        // Step 6: Set cookie & return response
        res
            .cookie("accessToken", accessToken, {
                httpOnly: true,
                sameSite: "strict",
                maxAge: 3 * 60 * 60 * 1000, // 3 hours
                secure: process.env.NODE_ENV === "production" // make sure HTTPS is used in prod
            })
            .json({
                success: true,
                field: null,
                message: "Logged in successfully",
                user: existingUser._id,
                accessToken: accessToken
            });


        console.log(`\nUser: ${existingUser._id}\nAccessToken: ${accessToken}`);

    } catch (error) {
        console.error("SignIn Error:", error);
        res.status(500).json({
            success: false,
            field: null,
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
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
  
    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  }
  


export async function sendVarificationCode(req, res) {
    const { email } = req.body;

    try {
        const { error } = sendCodeSchema.validate({ email });
        if (error) {
            return res.status(400).json({
                field: error.details[0].context.key,
                success: false,
                message: error.details[0].message
            });
        }

        const existingUser = await UserModel.findOne({ email });

        if (!existingUser) {
            return res.status(404).json({
                field: "email",
                success: false,
                message: "User doesn't exist"
            });
        }

        if (existingUser.verified) {
            return res.status(400).json({
                field: "email",
                success: false,
                message: "User is already verified"
            });
        }

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(resetCode);

        const sendingEmail = await sendEmail.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: 'Verification Code Request',
            html: `...`, // keep your email HTML as it is
        });

        if (sendingEmail.accepted[0] === existingUser.email) {
            const hashedValue = hmacProcess(resetCode, process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.verificationCode = hashedValue;
            existingUser.verificationCodeValidation = Date.now();

            await existingUser.save();

            return res.status(200).json({
                success: true,
                field: null,
                message: "Code sent to your email"
            });
        }

        return res.status(500).json({
            success: false,
            field: null,
            message: "Failed to send verification code email"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            field: null,
            message: "Internal server error"
        });
    }
}


export async function verifyVarificationCode(req, res) {
    let { email, providedCodeValue } = req.body;

    try {
        const { error } = acceptedCodeSchema.validate({ email, providedCodeValue });
        if (error) {
            return res.status(400).json({
                field: error.details[0].context.key,
                success: false,
                message: error.details[0].message
            });
        }

        providedCodeValue = providedCodeValue.toString();
        const existingUser = await UserModel.findOne({ email }).select('+verificationCode +verificationCodeValidation');

        if (!existingUser) {
            return res.status(404).json({
                field: 'email',
                success: false,
                message: "User doesn't exist"
            });
        }

        if (existingUser.verified) {
            return res.status(400).json({
                field: null,
                success: false,
                message: "User is already verified"
            });
        }

        if (!existingUser.verificationCode || !existingUser.verificationCodeValidation) {
            return res.status(400).json({
                field: null,
                success: false,
                message: "Verification code not found. Please request a new one."
            });
        }

        if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
            return res.status(401).json({
                field: null,
                success: false,
                message: "Code has expired! Please request a new one."
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
                field: null,
                message: "Code verified successfully"
            });
        }

        return res.status(400).json({
            field: 'providedCodeValue',
            success: false,
            message: "Invalid verification code"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            field: null,
            success: false,
            message: "Internal server error"
        });
    }
}




export async function changePassword(req, res) {
    const { userId } = req.user;
    const { oldPassword, newPassword } = req.body;

    try {
        const { error } = changePasswordSchema.validate({ oldPassword, newPassword });
        if (error) {
            return res.status(400).json({
                field: error.details[0].context.key,
                success: false,
                message: error.details[0].message
            });
        }

        const existingUser = await UserModel.findById(userId).select('+password');
        if (!existingUser) {
            return res.status(404).json({
                field: 'user',
                success: false,
                message: "User doesn't exist"
            });
        }

        const isMatch = await decryptHashedPassword(oldPassword, existingUser.password);
        if (!isMatch) {
            return res.status(401).json({
                field: 'oldPassword',
                success: false,
                message: "Old password is incorrect"
            });
        }

        existingUser.password = await doHash(newPassword, 12);
        await existingUser.save();

        return res.status(200).json({
            success: true,
            message: "🔒 Password updated successfully"
        });

    } catch (error) {
        console.error("Change Password Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}




export async function sendForgotPasswordCode(req, res) {
    const { email } = req.body;

    try {
        const { error } = sendCodeSchema.validate({ email });
        if (error) {
            return res.status(400).json({
                field: error.details[0].context.key,
                success: false,
                message: error.details[0].message
            });
        }

        const existingUser = await UserModel.findOne({ email });

        if (!existingUser) {
            return res.status(404).json({
                field: "email",
                success: false,
                message: "User doesn't exist"
            });
        }

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log("Reset Code:", resetCode);

        const sendingEmail = await sendEmail.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: 'Forgot Your Password – Verification Code Inside',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="text-align: center; color: #24292e;">GitHub-style Password Reset</h2>
                    <p>Hello ${existingUser.email || ''},</p>
                    <p>We received a request to reset your password. Use the verification code below to proceed:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 36px; font-weight: bold; color: #4CAF50;">${resetCode}</span>
                    </div>
                    <p style="text-align: center;">
                        <a href="http://localhost:3000/verify-reset-code?email=${existingUser.email}"
                           style="display: inline-block; padding: 12px 24px; background-color: #2ea44f; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Verify Code
                        </a>
                    </p>
                    <p><strong>Note:</strong> This code will expire in 5 minutes. If you didn’t request this, you can safely ignore this email.</p>
                    <p>Thanks,<br>The Support Team</p>
                </div>
            `
        });

        if (sendingEmail.accepted[0] === existingUser.email) {
            const hashedValue = hmacProcess(resetCode, process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.forgotPasswordCode = hashedValue;
            existingUser.forgotPasswordCodeValidation = Date.now();
            await existingUser.save();

            return res.status(200).json({
                success: true,
                field: null,
                message: "Code sent to your email"
            });
        }

        return res.status(400).json({
            success: false,
            field: null,
            message: "Failed to send the verification code"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            field: null,
            message: "Internal server error"
        });
    }
}


export async function verifysendForgotPasswordCode(req, res) {
    const { email, providedCodeValue, newPassword } = req.body;

    try {
        const { error } = acceptForgotPasswordSchema.validate({ email, providedCodeValue, newPassword });
        if (error) {
            return res.status(400).json({
                success: false,
                field: error.details[0].context.key,
                message: error.details[0].message
            });
        }

        const user = await UserModel.findOne({ email }).select('+forgotPasswordCode +forgotPasswordCodeValidation');

        if (!user) {
            return res.status(404).json({
                success: false,
                field: 'email',
                message: "User doesn't exist"
            });
        }

        if (!user.forgotPasswordCode || !user.forgotPasswordCodeValidation) {
            return res.status(400).json({
                success: false,
                field: null,
                message: "Reset code not found. Please request a new one."
            });
        }

        if (Date.now() - user.forgotPasswordCodeValidation > 5 * 60 * 1000) {
            return res.status(401).json({
                success: false,
                field: null,
                message: "Code has expired! Please request a new one."
            });
        }

        const hashedCode = hmacProcess(providedCodeValue.toString(), process.env.HMAC_VERIFICATION_CODE_SECRET);

        if (hashedCode !== user.forgotPasswordCode) {
            return res.status(400).json({
                success: false,
                field: 'providedCodeValue',
                message: "Invalid code"
            });
        }

        const hashedPassword = await doHash(newPassword, 12);
        user.password = hashedPassword;
        user.forgotPasswordCode = undefined;
        user.forgotPasswordCodeValidation = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            field: null,
            message: "Password reset was successfully!"
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            field: null,
            message: "Internal server error"
        });
    }
}




/**
 Absolutely! Here’s a **comprehensive, full summary of building a house in South Africa** — the **smart, safe way** — using a **Project Manager (PM)** and a **lawyer** to protect your budget, timelines, and peace of mind.

---

# 🏠 Full Process of Building a House in South Africa

**With a Project Manager & Lawyer Involved**

---

## 📍 **1. Buying the Plot (Land)**

### ✅ Steps:

1. **Find suitable land** (residential zoning, serviced if possible).
2. **Do due diligence**:

   * Check title deed, servitudes, and municipal zoning.
3. **Make an offer** and sign the **Offer to Purchase (OTP)**.
4. **Transfer Process**:

   * Conveyancer (lawyer) handles registration at the **Deeds Office**.
   * Pay **transfer duty** (unless under R1.1 million or “No Transfer Duty” applies).
   * Ownership takes 6–12 weeks to register.

---

## 🧱 **2. Planning & Design Phase**

### ✅ Key Players:

* **Architect** – designs your house (required by law).
* **Project Manager (PM)** – oversees the build, manages workers, keeps budget on track.
* **Lawyer** – drafts or reviews contracts with builders and professionals.

### ✅ Tasks:

1. **Hire architect** to draft plans.
2. Submit plans to **municipality for approval**.
3. Register the build with the **NHBRC** (required by law).
4. Draft **contract agreements**:

   * Between you and the contractor (handled by lawyer).
   * Should cover: scope, budget, progress payments, penalties, dispute resolution, warranties.

---

## 💰 **3. Budget Planning**

You must provide your PM with a **clear, written budget**, broken down by stages (foundation, roof, plumbing, etc.).

### ✅ Include:

* Construction costs
* Professional fees (PM, architect, engineer)
* NHBRC registration
* Utility connection fees
* 10–15% **contingency reserve** for emergencies

> 📝 PM uses this to source materials, vet quotes, and control spending. You approve large purchases.

---

## 🏗️ **4. Construction Phase**

### ✅ Steps (all monitored by your PM):

| Stage                 | Description                       | Who’s Involved           |
| --------------------- | --------------------------------- | ------------------------ |
| Site prep             | Clearing and pegging              | PM + Contractor          |
| Foundation            | Dug, poured, inspected            | NHBRC + Municipality     |
| Superstructure        | Walls, roofing, windows           | PM manages timeline      |
| Plumbing & Electrical | Rough-ins, geyser, DB board       | Registered professionals |
| Finishes              | Tiling, ceilings, paint, cabinets | PM ensures quality       |
| Final inspections     | NHBRC + municipal sign-offs       | PM + building inspectors |

Your PM ensures:

* All work is **up to standard**.
* All inspections are **booked and passed**.
* Your **money is not misused**.

---

## ⚖️ **5. Contract & Payment Management**

Your **lawyer**:

* Drafts a **progress-based payment agreement**.
* Includes a **retention clause** (withhold 5–10% until after 3 months of move-in).
* Ensures there are **penalties for delays** and poor workmanship.

### 🧾 Example Payment Schedule:

| Milestone             | % Paid |
| --------------------- | ------ |
| Site Cleared          | 5%     |
| Foundation Complete   | 10%    |
| Walls & Roof          | 20%    |
| Plumbing & Electrical | 15%    |
| Windows & Plastering  | 10%    |
| Finishes              | 15%    |
| Final Completion      | 15%    |
| Snag List Cleared     | 10%    |

> Never pay more than 10% upfront. Lawyer includes this in the contract.

---

## 🏡 **6. Final Handover & Occupation**

### ✅ What Happens:

1. **Final inspection** by municipality (Certificate of Occupancy issued).
2. PM compiles a **snag list** – items the contractor must fix before full payment.
3. You move in!
4. Retention money stays with you for 3 months — only paid if no issues arise.

---

## 🧠 Summary of Key Benefits Using PM + Lawyer

| Role                  | Purpose                            | Benefits                                             |
| --------------------- | ---------------------------------- | ---------------------------------------------------- |
| **Project Manager**   | Manages build from start to finish | Saves time, avoids cost overruns, ensures quality    |
| **Lawyer**            | Drafts enforceable contracts       | Protects your money, legal backup if things go wrong |
| **Architect + NHBRC** | Ensures legal compliance           | Mandatory for safety and legality                    |
| **You (Owner)**       | Provide budget, approve decisions  | Maintain control without daily site involvement      |

---

## 🧾 Final Checklist Before You Start:

* [ ] Plot bought and registered
* [ ] Building plans approved
* [ ] NHBRC registration done
* [ ] Lawyer-drafted building contract signed
* [ ] Budget finalized and shared with PM
* [ ] Construction team vetted and secured
* [ ] Utilities (water, electricity) applied for
* [ ] Insurance (builder’s and home) in place

---

Let me know if you’d like:

* A **PDF version** of this summary
* A **budget spreadsheet**
* A **sample contract template**
  Happy to help you prepare!











  
 */