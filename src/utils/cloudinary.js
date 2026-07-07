import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import { env } from "process";

dotenv.config({
  path: "./env",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (LocalFilePath) => {
  try {
    if (!LocalFilePath) return null;

    //if file path exist upload to cloudinary
    const response = await cloudinary.uploader.upload(LocalFilePath, {
      resource_type: "auto",
    });
    // console.log(
    //   `---- your file has been uploaded to cloudinary ----`,
    //   response.url,
    // );

    await fs.promises.unlink(LocalFilePath);

    return response;
  } catch (error) {
    // remove locally saved temp file after the operation gets failed
    await fs.promises.unlink(LocalFilePath);
    return null;
  }
};

const deleteFromCloudinary = async (publicIdPath, resourceType) => {
  try {
    if (!publicIdPath) return null;

    const response = await cloudinary.uploader.destroy(publicIdPath, {
      resource_type: resourceType,
    });

    return response;
  } catch (error) {
    console.log("Cloudinary deletion error");
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
