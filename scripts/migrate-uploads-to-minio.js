// One-time migration: copies every file in ./uplouds into MinIO and normalizes stored image names.
// Usage: npm run migrate:uploads   (safe to run more than once)
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { client, BUCKET, ensureBucket } = require("../config/minio");
const User = require("../models/users.model");
const Course = require("../models/courses.model");

const UPLOAD_DIR = path.join(__dirname, "..", "uplouds");
const CONTENT_TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp" };

const exists = (name) =>
  client.statObject(BUCKET, name).then(() => true, () => false);

const uploadFolder = async () => {
  if (!fs.existsSync(UPLOAD_DIR)) return console.log("No uplouds folder, nothing to copy");
  for (const name of fs.readdirSync(UPLOAD_DIR)) {
    const file = path.join(UPLOAD_DIR, name);
    if (!fs.statSync(file).isFile()) continue;
    if (await exists(name)) {
      console.log(`skip   ${name} (already in MinIO)`);
      continue;
    }
    const type = CONTENT_TYPES[path.extname(name).toLowerCase()] || "application/octet-stream";
    await client.fPutObject(BUCKET, name, file, { "Content-Type": type });
    console.log(`upload ${name}`);
  }
};

// "uplouds/x.jpg" / "coursesimg/x.jpg" -> "x.jpg"
const normalizeField = async (Model, field) => {
  const docs = await Model.find({ [field]: /\// }, { [field]: 1 });
  for (const doc of docs) {
    await Model.updateOne({ _id: doc._id }, { $set: { [field]: path.basename(doc[field]) } });
  }
  console.log(`normalized ${docs.length} ${Model.modelName}.${field} value(s)`);
};

(async () => {
  try {
    await ensureBucket();
    await uploadFolder();
    await mongoose.connect(process.env.url);
    await normalizeField(User, "avatar");
    await normalizeField(Course, "imgcourse");
    console.log("Migration finished. You can delete the local uplouds folder once images load correctly.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
