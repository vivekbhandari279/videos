import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getNextUhid } from "../utils/getNextUhid.js";

const userSchema = new mongoose.Schema(
  {
    uhid: {
      type: Number,
      unique: true,
      required: [true, "UHID is required"],
      index: true,
    },
    userName: {
      type: String,
      unique: true,
      required: [true, "Username is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      max: 100,
      lowercase: true,
      trim: true,
    },
    phoneCode: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      enum: ["Mr", "Mrs", "Miss", "Dr", "Prof"],
      required: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      maxlength: [20, "First name length should not exceed 20 characters"],
      lowercase: true,
      trim: true,
      index: true,
    },
    middleName: {
      type: String,
      maxlength: [20, "Middle name length should not exceed 20 characters"],
      lowercase: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      maxlength: [20, "Last name length should not exceed 20 characters"],
      lowercase: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      required: [true, "Profile picture is required"],
    },
    coverImage: {
      type: String,
    },
    password: {
      type: String,
      minlength: [8, "Password length should be at least 8 characters"],
      maxlength: [20, "Password length should not exceed 20 characters"],
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  { timestamps: true }
);
userSchema.pre("validate", async function (next) {
  if (this.isNew && !this.uhid) {
    try {
      this.uhid = await getNextUhid("uhid");
    } catch (error) {
      return next(error);
    }
  }
  next();
});
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
