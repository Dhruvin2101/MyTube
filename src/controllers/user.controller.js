import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get data from the user
  // validation
  // chceck if the user exist in db or not
  // check for image and avatar etc
  // upload them to cloudinary
  // create user obj
  // add user obj in db
  // remove pass and refreshtoken from feild
  // check for user response
  // return res else error

  const { username, email, fullName, password } = req.body;

  // .some will iterate through arr for each item and return a boolean value
  if (
    [username, email, fullName, password].some(
      (fields) => fields?.trim() === "",
    )
  ) {
    throw new apiError(201, "Filling all the fields are mandatory");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new apiError(409, "user with username or email already exists");
  }

  // fethcing the path from files in request`
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new apiError(400, "avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", // if no cover image(no url) then empty string in db
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new apiError(500, "Something went wrong while creating the user");
  }

  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User registered Successfully"));
});

export { registerUser };
