
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, unique: true, lowercase: true },
    user_type: { type: String, enum: ["mentee", "mentor"] },
    provider: { type: String, enum: ["local", "google", "github"], default: "local" },
    verified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const UserModel = mongoose.model("UserModel", userSchema);

export default UserModel;
