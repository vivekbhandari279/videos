import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  isEmailValid,
  isPasswordValid,
  requiredCheck,
} from "../utils/validation.js";
import { User } from "../models/user.model.js";
import { deleteFileFromCloudinary, uploadOnCloudinary } from "../utils/fileUploader.js";
import jwt from "jsonwebtoken";
import axios from "axios";

const registerUser = asyncHandler(async (req, res) => {
  /**
   * ToDos:
   * Get user details from frontend.
   * Validation not-empty.
   * Check is user already exist, username and email.
   * Check for images and avatar.
   * Upload images to cloudinary.
   * Check Avatar uploaded on cloudinary or not.
   * Create entry in DB. and check for user creation.
   * if response available, Remove password from response and return.
   * else, return error.
   */

  // Get user details from frontend.
  const {
    title,
    firstName,
    middleName,
    lastName,
    userName,
    email,
    password,
    avatar,
    coverImage,
    phoneCode,
    phone,
  } = req.body;

  // console.log(req.body);

  // Validation not-empty.
  requiredCheck([title, firstName, lastName, userName, email, password]);

  // Check valid email.
  isEmailValid(email);

  // Check valid password.
  isPasswordValid(password);

  if (phone) {
  }

  // Check email and username exists ?
  const emailExists = await User.findOne({ email });

  if (emailExists) {
    throw new ApiError(409, "Email already exists");
  }
  const userNameExists = await User.findOne({ userName });
  if (userNameExists) {
    throw new ApiError(409, "Username already exists");
  }

  // Check for images and avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath = "";
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // console.log(req.files);
  // // return false;

  if (!avatarLocalPath.trim().length) {
    throw new ApiError(404, "Avatar file is required");
  }

  const avatarImageResponse = await uploadOnCloudinary(avatarLocalPath);

  if (!avatarImageResponse) {
    throw new ApiError(500, "Avatar file unable to upload on image server");
  }

  let coverImageResponse = null;
  if (coverImageLocalPath) {
    coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);
  }

  const user = await User.create({
    title,
    firstName: firstName.toLowerCase(),
    middleName: middleName?.toLowerCase() || "",
    lastName: lastName.toLowerCase(),
    userName: userName.toLowerCase(),
    email: email.toLowerCase(),
    password,
    avatar: avatarImageResponse.url,
    coverImage: coverImageResponse?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Somthing went wrong while registring the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const generateAccessAndRefereshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    if (!accessToken && !refreshToken) {
      throw new ApiError(
        500,
        "Somthing went wrong while generating accese and referesh token"
      );
    }

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.error(error);
    throw new ApiError(
      error?.statusCode || 500,
      error?.message ||
        "Somthing went wrong while generating access and refresh tokens"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  /**
   * ToDos:
   * Get email/username and password from user.
   * Check for empty.
   * find user in DB.
   * If user exist, then patch the password.
   * If credentials matched, then Generate Access and Refresh tokens.
   * Update refresh token in DB.
   * Send required data to the user with user data.
   * Send access and referesh token in the secure cookies.
   * If user not exist send the appropreate response with msg.
   */

  try {
    const { userName, email, password } = req.body;

    if (!email && !userName) {
      throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
      $or: [{ userName }, { email }],
    });

    if (!user) {
      throw new ApiError(404, "User dose not exist");
    }

    if (!password) {
      throw new ApiError(400, "Password is required");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      throw new ApiError(404, "Invalid user Credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshToken(
      user._id
    );

    const userdata = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const option = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", refreshToken, option)
      .json(
        new ApiResponse(
          200,
          {
            user: userdata,
            accessToken,
            refreshToken,
          },
          "User logged-in successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Somthing went wrong while user login"
    );
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: "",
        },
      },
      {
        new: true,
      }
    );

    const option = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", option)
      .clearCookie("refreshToken", option)
      .json(new ApiResponse(200, {}, "User logged-out successfully"));
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Somthing went wrong while logging out user"
    );
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      console.error("Refresh token is empty");
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      console.error("Invalid access token");
      throw new ApiError(401, "Unauthorized request");
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      console.error("Refresh token not matcched");
      throw new ApiError(401, "Unauthorized request");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshToken(
      user._id
    );
    const userdata = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const option = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", refreshToken, option)
      .json(
        new ApiResponse(
          200,
          {
            user: userdata,
            accessToken,
            refreshToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Somthing went wrong while refresh access token"
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  /**
   * ToDo
   * Get current password and new password input.
   * Verify is that current password provided by the user is correct or not.
   * if correct then encode the new password provided by user and update in user table.
   */
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    requiredCheck([oldPassword, newPassword, confirmPassword]);

    if (newPassword !== confirmPassword) {
      throw new ApiError(400, "New and confirm password should be same");
    }

    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password");
    }

    // Check valid password.
    isPasswordValid(newPassword);

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Somthing went wrong while changing password"
    );
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized access");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user: req.user },
          "Fetched user data successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Somthing went wrong while getting current user"
    );
  }
});

/**
 * Note: If you are updating any file trype make sure you update in a seprate code and route should be seprate, its just a producttion lavel prectice nothing else
 */
const updateUser = asyncHandler(async (req, res) => {
  try {
    const { title, firstName, middleName, lastName, email, phoneCode, phone } =
      req.body;

    requiredCheck([
      title,
      firstName,
      middleName,
      lastName,
      email,
      phoneCode,
      phone,
    ]);

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          title,
          firstName,
          middleName,
          lastName,
          email,
          phoneCode,
          phone,
        },
      },
      { new: true }
    ).select("-password");

    res
      .status(200)
      .json(new ApiResponse(200, { user }, "User data updated successfully"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Somthing went wrong while updating the user"
    );
  }
});

const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(422, "Avatar file is required");
  }
  const avatarLocalPath = req.file?.path;
  if (!req.file) {
    throw new ApiError(422, "Avatar file path is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Avatar file path is missing");
  }

  const oldUsserData = await User.findById(req.user._id);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  if (req.user.avatar) {
    await deleteFileFromCloudinary(req.user.avatar);
  }

  res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated succesfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(422, "Cover image file is required");
  }
  const coverImageLocalPath = req.file?.path;
  if (!req.file) {
    throw new ApiError(422, "Cover image file path is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Cover image file path is missing");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  if (req.user.coverImage) {
    await deleteFileFromCloudinary(req.user.coverImage);
  }

  res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated succesfully"));
});

const testFunction = asyncHandler(async (req, res) => {});



export {
  testFunction,
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUser,
  updateAvatar,
  updateCoverImage,
};
