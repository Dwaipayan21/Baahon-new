import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    points: {
      type: Number,
      default: 0,
      min: 0,
    },

    favourites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pandal",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;