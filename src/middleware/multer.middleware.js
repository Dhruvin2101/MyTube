import multer from "multer";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "./public/temp");
  },

  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const videoFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-matroska",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported video format. Please upload MP4, MPEG, MOV or MKV."
      ),
      false
    );
  }
};

const imageFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported image format. Please upload JPEG, PNG, WebP, HEIC or HEIF."
      ),
      false
    );
  }
};

const videoAndThumbnailFilter = (req, file, cb) => {
  if (file.fieldname === "video") {
    const allowedVideoMimeTypes = [
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/x-matroska",
    ];

    if (!allowedVideoMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Unsupported video format. Please upload MP4, MPEG, MOV or MKV."
        ),
        false
      );
    }
  }

  if (file.fieldname === "thumbnail") {
    const allowedImageMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];

    if (!allowedImageMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Unsupported image format. Please upload JPEG, PNG, WebP, HEIC or HEIF."
        ),
        false
      );
    }
  }

  cb(null, true);
};

const uploadVideoMiddleware = multer({
  storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
});

const uploadImageMiddleware = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

const uploadVideoAndThumbnailMiddleware = multer({
  storage,
  fileFilter: videoAndThumbnailFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB
  },
});

export {
  uploadImageMiddleware,
  uploadVideoMiddleware,
  uploadVideoAndThumbnailMiddleware,
};
