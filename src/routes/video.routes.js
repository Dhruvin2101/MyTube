import { uploadVideo, getVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { Router } from "express";
import {
  uploadVideoMiddleware,
  uploadImageMiddleware,
  uploadVideoAndThumbnailMiddleware,
} from "../middleware/multer.middleware.js";

const router = Router();

router.route("/upload-video").post(
  verifyJWT,
  uploadVideoAndThumbnailMiddleware.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  uploadVideo
);
router.route("/get-video").get(verifyJWT, getVideo);

export default router;
