import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  //when the user is login in we are sending a accessToken which is signed by jwt and it has payload
  //when the user hits logout he stills has that cookie stored
  //we take the cookies and decodes it to get payload
  //once we get payload we get user's id
  //we are sending that user's payload into req
  //this all is happening bcz when the user hits logout he doesnt provide his username and pass so bcz of that we have to do this to find which user is trying to get logged out
  try {
    const token =
      req.cookies?.accessToken || //here it is "cookies" not cookie
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new apiError(401, "Unauthorized Access");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new apiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid Access Token");
  }
});
