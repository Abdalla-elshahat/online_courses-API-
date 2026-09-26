const multer = require("multer");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// keep uploads in memory; file.service validates the bytes and stores them in MinIO
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    const err = new Error("File must be a JPEG, PNG, GIF or WEBP image");
    err.status = 400;
    cb(err, false);
  },
});

module.exports = { upload };
