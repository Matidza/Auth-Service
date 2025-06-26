import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    //Email
    email: {
        type: String,
        required: [true, "email is required!"],
        trim: true,
        unique: [true, "email already exists"],
        minlength: [5, "email must be a minimum of 5 characters"],
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, "password must be provided!"],
        trim: true,
        select: false,
    },
    verified: {
        type: Boolean
    },
    verificationCode: {
        type: String,
        select: false
    },
    verificationCodeValidation: {
        type: Number,
        select: false
    },
    forgotPasswordCode: {
        type: String,
        select: false
    },
    forgotPasswordCodeValidation: {
        type: Number,
        select: false
    }
}, {
    timestamps: true
});

const UserModel = mongoose.model("UserModel", userSchema);
export default UserModel;