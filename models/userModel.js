import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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
    required: function () {
      return !this.provider || this.provider === 'local';
    },
    trim: true,
    select: false,
  },
  provider: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local',
  },
  verified: Boolean,
  verificationCode: {
    type: String,
    select: false,
  },
  verificationCodeValidation: {
    type: Number,
    select: false,
  },
  forgotPasswordCode: {
    type: String,
    select: false,
  },
  forgotPasswordCodeValidation: {
    type: Number,
    select: false,
  },
}, {
  timestamps: true
});

const UserModel = mongoose.model("UserModel", userSchema);
export default UserModel;
