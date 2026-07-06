import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateaccessandrefreshtoken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      // "Something went wrong while creating Access and Refresh token"
      error
    );
  }
};

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
      (fields) => fields?.trim() === ""
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
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(500, "Something went wrong while creating the user");
  }

  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get data -> req.body
  // validate username and password
  // find user in db
  // generate access and refresh token
  // send them in cookie

  const { username, email, password } = req.body;

  if (!(username || email) || !password) {
    throw new apiError(404, "Invalid username/email and Password");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new apiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(401, "Incorrect Password");
  }

  const { accessToken, refreshToken } = await generateaccessandrefreshtoken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-refreshToken -password"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully !!"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      refreshToken: undefined,
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User LoggedOut Successfully !!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRequestToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRequestToken) {
      throw new apiError(401, "Unauthorized Access");
    }

    const decodedToken = jwt.verify(
      incomingRequestToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new apiError(401, "Invalid Refresh Token");
    }

    if (incomingRequestToken !== user?.refreshToken) {
      throw new apiError(401, "This Request token is invalid or expired ");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateaccessandrefreshtoken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          ""
        )
      );
  } catch (error) {
    throw new apiError(error?.message || "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!(oldPassword || newPassword)) {
    throw new apiError(401, "Enter valid passwords");
  }

  const user = await User.findById(req.user?._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new apiError(400, "Invalid Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new apiResponse(200, {}, "Password updated successfully !!"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new apiError(401, "Something went Wrong");
  }

  res
    .status(200)
    .json(
      new apiResponse(200, { user }, "Current user fetched Successfully !!")
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!(fullName || email)) {
    throw new apiError(401, "Enter valid Fullname and Email");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { fullName, email },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .status(200)
    .json(
      new apiResponse(
        200,
        { user },
        "fullName and email updated succesfully !!"
      )
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.avatar[0]?.path;

  console.log(avatarLocalPath);

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is missing");
  }

  const newAvatar = await uploadOnCloudinary(avatarLocalPath);

  if (!newAvatar.url) {
    throw new apiError(400, "Error while uploading on Avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { avatar: newAvatar.url },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .status(200)
    .json(new apiResponse(200, { user }, "Avatar updates successfully "));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!coverImageLocalPath) {
    throw new apiError(400, "coverImage file is missing");
  }

  const newCoverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!newCoverImage.url) {
    throw new apiError(400, "Error while uploading on Cover Image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { coverImage: newCoverImage.url },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .status(200)
    .json(new apiResponse(200, { user }, "Cover Image updates successfully "));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  console.log(username);

  if (!username.trim()) {
    throw new apiError(401, "invalid username");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id", // localField == foreignFiel (compared) so, user.id
        foreignField: "channel", // this will get all the channels == user.id
        as: "subsribers", // this will get us an array of all the users that have subscribed to channel==user.id
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id", //user.id
        foreignField: "subscriber", //susubscriber == user.id
        as: "subsribedTo", // this will give us an array of all the channels that user has subscirbed to
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subsribers", // return the count of the subscribers user have
        },
        channelsSubscribedToCount: {
          $size: "$subsribedTo", // returns the count of channels user has subscriber to
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subsribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        coverImage: 1,
        avatar: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
  console.log(channel);
  res
    .status(200)
    .json(
      new apiResponse(
        201,
        { channel },
        "Channel profile fetched successfully !"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
};
