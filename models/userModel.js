import mongoose from "mongoose";

const usersSchema = new mongoose.Schema({
    //Email
    email: {
        type: String,
        required: [true, "Email is required!"],
        trim: true,
        unique: [true, "Email must be unique!"],
        minlength: [5, "Email must be a minimum of 5 characters"],
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, "Password must be provided!"],
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

const UserModel = mongoose.model("UserModel", usersSchema);
export default UserModel;