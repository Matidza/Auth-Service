import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "title is required!"],
    trim: true, 
  },
  description: {
    type: String,
    required: [true, "description is required!"],
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  }

}, {
  timestamps: true
});

const PostModel = mongoose.model("PostModel", postSchema);
export default PostModel;