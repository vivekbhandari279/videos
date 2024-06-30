import { ApiError } from "./ApiError.js";

export const requiredCheck = (fields) => {
  if ((fields.some((field) => field?.trim() === "")) || 
  fields.some((field) => field?.trim() === undefined)) {
    throw new ApiError(404, "All fields are required");
  }
};

export const isEmailValid = (email) => {
    let testStr = /\S+@+\S+\.\S+/;
    if (!testStr.test(email.toLowerCase())){
        throw new ApiError(422, "Please provide valid email")
    }
};

export const isPasswordValid = (password) => {
    if ((password.length < 8) && (password.length > 20)){
        throw new ApiError(422, "Password length should be 8-20 characters only")
    }
};