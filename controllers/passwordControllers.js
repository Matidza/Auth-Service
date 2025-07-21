import UserModel from "../models/userModel.js";
import {
    acceptedCodeSchema, changePasswordSchema, 
    acceptForgotPasswordSchema, sendCodeSchema } from "../middlewares/validators.js";
import doHash, { decryptHashedPassword, hmacProcess } from "../utilities/hashing.js";
import dotenv from "dotenv";
import sendEmail from "../middlewares/sendEmail.js";

dotenv.config();
 

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


export const changePassword = async (req, res) => {
  const { userId } = req.user;
  const { oldPassword, newPassword } = req.body;

  // ✅ 1. Validate input
  const { error } = changePasswordSchema.validate({ oldPassword, newPassword });
  if (error) {
    return res.status(400).json({
      field: error.details[0].context.key,
      success: false,
      message: error.details[0].message,
    });
  }

  // ✅ 2. Find user
  const existingUser = await UserModel.findById(userId).select('+password');
  if (!existingUser) {
    return res.status(404).json({
      field: 'user',
      success: false,
      message: "User doesn't exist",
    });
  }

  // ✅ 3. Check old password
  const isMatch = await decryptHashedPassword(oldPassword, existingUser.password);
  if (!isMatch) {
    return res.status(401).json({
      field: 'oldPassword',
      success: false,
      message: "Old password is incorrect",
    });
  }

  // ✅ 4. Update password
  existingUser.password = await doHash(newPassword, 12);
  await existingUser.save();

  return res.status(200).json({
    success: true,
    message: "🔒 Password updated successfully",
  });
};


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
