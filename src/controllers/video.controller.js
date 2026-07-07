import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { getPublicID } from "../utils/getPublicId.js";

const uploadVideo = asyncHandler(async (req, res) => {
  //check if user is logged in or not
  //upload the video on cloudinary
  // if success store the cloudiary url on

  const { title, description } = req.body;

  if (!title.trim() && !description.trim) {
    throw new apiError(400, "title and description not found");
  }

  const uploadedVideoLocalPath = req?.files?.video[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!uploadedVideoLocalPath) {
    throw new apiError(400, "Uploaded video not found");
  }
  if (!thumbnailLocalPath) {
    throw new apiError(400, "Uploaded thumbnail not found");
  }

  const uploadedVideo = await uploadOnCloudinary(uploadedVideoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!uploadedVideo) {
    throw new apiError(400, "Failed to upload the video");
  }
  if (!thumbnail) {
    throw new apiError(400, "Failed to upload the thumbnail");
  }

  const video = await Video.create({
    videoFile: uploadedVideo.url,
    thumbnail: thumbnail.url,
    title: title,
    description: description,
    duration: uploadedVideo.duration,
    owner: req.user._id,
  });

  if (!video) {
    throw new apiError(401, "Error uploding user detials in db");
  }

  res
    .status(200)
    .json(new apiResponse(200, video, "video uploaded successfully"));
});

const getVideo = asyncHandler(async (req, res) => {
  // match user's id to owner
  // display all the videos

  const video = await Video.find({
    owner: req.user._id,
  });

  res
    .status(200)
    .json(new apiResponse(200, video, "videos fetched successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new apiError(400, "video not found ");
  }

  const video = await Video.findById(id);

  if (!video) {
    throw new apiError(400, "Video does not exist");
  }

  if (!video.owner.equals(req.user._id)) {
    throw new apiError(403, "Unauthorized");
  }

  //video deletion on cloudinary
  const videoPublicID = getPublicID(video.videoFile);
  const thumbnailPublicID = getPublicID(video.thumbnail);

  await deleteFromCloudinary(videoPublicID, "video");
  await deleteFromCloudinary(thumbnailPublicID, "image");

  await video.deleteOne();

  res.status(200).json(new apiResponse(200, {}, "Video deleted successfully"));
});

export { uploadVideo, getVideo, deleteVideo };
