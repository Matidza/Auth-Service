import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required!"],
      trim: true,
      unique: [true, "Email already exists"],
      minlength: [5, "Email must be a minimum of 5 characters"],
      lowercase: true,
    },

    password: {
      type: String,
      required: function () {
        return !this.provider || this.provider === 'local';
      },
      trim: true,
      select: false, // Hide from query results
    },

    user_type: {
      type: String,
      enum: ['mentee', 'mentor'],
      default: 'mentee', // ✅ Default role
    },

    provider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local',
    },

    verified: {
      type: Boolean,
      default: false,
    },

    verificationCode: {
      type: String,
      select: false, // Hide from query results
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
  },
  {
    timestamps: true, // ✅ Adds createdAt and updatedAt fields
  }
);

const UserModel = mongoose.model("UserModel", userSchema);

export default UserModel;
