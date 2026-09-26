const Minio = require("minio");

const BUCKET = process.env.MINIO_BUCKET || "online-courses";

const client = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

// creates the (private) bucket on first run
const ensureBucket = async () => {
  try {
    if (!(await client.bucketExists(BUCKET))) {
      await client.makeBucket(BUCKET);
      console.log(`MinIO bucket "${BUCKET}" created`);
    }
    console.log("connected to MinIO");
  } catch (err) {
    console.error("Failed to connect to MinIO:", err.message);
  }
};

module.exports = { client, BUCKET, ensureBucket };
