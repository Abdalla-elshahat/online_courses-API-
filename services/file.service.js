const crypto = require("crypto");
const fileRepository = require("../repositories/file.repository");
const { AppError } = require("../utles/app-error");

const DEFAULT_IMAGE = "no-photo-available-icon-20.jpg";
const SAFE_NAME = /^[A-Za-z0-9._-]{1,200}$/;

// detect the real type from the file's first bytes; the client-sent mimetype can't be trusted
const SIGNATURES = [
  { ext: "jpg", type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", type: "image/png", test: (b) => b.readUInt32BE(0) === 0x89504e47 },
  { ext: "gif", type: "image/gif", test: (b) => b.toString("ascii", 0, 4) === "GIF8" },
  {
    ext: "webp",
    type: "image/webp",
    test: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
  },
];

const detectImage = (buffer) =>
  buffer && buffer.length >= 12 ? SIGNATURES.find((s) => s.test(buffer)) : undefined;

// uploads an image from multer (memory storage) and returns its object name
const saveImage = async (file, prefix) => {
  const image = detectImage(file?.buffer);
  if (!image) {
    throw new AppError(400, { message: "File must be a JPEG, PNG, GIF or WEBP image" });
  }
  const name = `${prefix}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${image.ext}`;
  await fileRepository.put(name, file.buffer, image.type);
  return name;
};

// best-effort cleanup of a replaced/removed image; never removes the shared default
const deleteImage = async (name) => {
  if (!name || name === DEFAULT_IMAGE || !SAFE_NAME.test(name)) return;
  try {
    await fileRepository.remove(name);
  } catch (err) {
    console.error(`Failed to delete image "${name}":`, err.message);
  }
};

const getImage = async (name) => {
  if (!SAFE_NAME.test(name)) {
    throw new AppError(400, { message: "Invalid file name" });
  }
  try {
    const info = await fileRepository.stat(name);
    const stream = await fileRepository.getStream(name);
    return {
      stream,
      size: info.size,
      contentType: info.metaData?.["content-type"] || "application/octet-stream",
    };
  } catch (err) {
    if (err.code === "NotFound" || err.code === "NoSuchKey") {
      throw new AppError(404, { message: "File not found" });
    }
    throw err;
  }
};

module.exports = { DEFAULT_IMAGE, saveImage, deleteImage, getImage };
