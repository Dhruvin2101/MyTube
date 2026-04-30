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

try {
  const uploadOnCloudinary = async (LocalFilePath) => {
    if (!LocalFilePath) return null;

    //if file path exist upload to cloudinary
    const response = await cloudinary.uploader.upload(LocalFilePath, {
      resource_type: "auto",
    });
    console.log(
      `---- your file has been uploaded to cloudinary ----`,
      response.url,
    );
  };
} catch (error) {
  // remove locally saved temp file after the operation gets failed
  fs.unlinkSync(LocalFilePath);

  return null;
}
