import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      default: "",
    },

    googleId: {
      type: String,
      default: null,
    },
    firebaseUid: {
      type: String,
      default: null,
      sparse: true,
      unique: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "firebase"],
      default: "local",
    },
    role: {
      type: String,
      enum: ["user", "community", "authority", "admin"],
      default: "user",
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },

  {
    timestamps: true,
  },
);

const User = mongoose.model("User", UserSchema);

export default User;
