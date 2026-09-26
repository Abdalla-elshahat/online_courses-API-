const fileService = require("../services/file.service");
const { sendIfAppError } = require("../utles/app-error");

// streams an image from MinIO so existing `${domain}/uplouds/<name>` URLs keep working
const getImage = async (req, res) => {
  try {
    const { stream, size, contentType } = await fileService.getImage(req.params.name);
    res.set({
      "Content-Type": contentType,
      "Content-Length": size,
      "Cache-Control": "public, max-age=31536000, immutable", // names are unique per upload
    });
    stream.on("error", () => res.destroy());
    stream.pipe(res);
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error reading image:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getImage };
