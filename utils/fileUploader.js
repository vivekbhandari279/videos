import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const uploadOnCloudinary = async (localFilePath) => {
  // cloudinary Configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    if (!localFilePath) return null;

    // Upload the file on couldinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // File has been uploaded successfully
    if (response.url) {
      console.log("File has been uploaded successfully on cloudinary");
    } else {
      console.log("File has not uploaded on cloudinary");
    }
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error(error);
    fs.unlinkSync(localFilePath); // Remove files from the server if the uploading operation failed.
    return null;
  }
};

const extractPublicId = (url) => {
  const urlParts = url.split('/');
  const versionAndId = urlParts[urlParts.length - 1].split('.');
  const publicId = urlParts.slice(7, -1).concat(versionAndId[0]).join('/');
  return publicId;
}

export const deleteFileFromCloudinary = async(url) => {
  try {
    const publicId = extractPublicId(url);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('File deleted successfully:', result);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

