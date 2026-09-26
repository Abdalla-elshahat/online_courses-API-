require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const { ensureBucket } = require("./config/minio");
const sanitize = require("./middleware/sanitize");
const { apiLimiter } = require("./middleware/rate-limit");
const fileRoutes = require("./routes/file.routes");
const userRoutes = require("./routes/user.routes");
const courseRoutes = require("./routes/course.routes");
const quizRoutes = require("./routes/quiz.routes");

connectDB();
ensureBucket();

// comma-separated list of allowed frontend origins; unset = allow any (development)
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.set("trust proxy", 1); // correct client IPs for rate limiting behind a proxy
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // images load from the frontend's origin
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(sanitize);

// images are stored in MinIO; this keeps `${domain}/uplouds/<name>` URLs working
app.use("/uplouds", fileRoutes);

app.use("/api", apiLimiter);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/quiz", quizRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// errors passed to next(): bad JSON, rejected uploads, anything unexpected
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({ message: err.code === "LIMIT_FILE_SIZE" ? "Image must be 2 MB or smaller" : err.message });
  }
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ message: err.expose === false ? "Bad request" : err.message });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
