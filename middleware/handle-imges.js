const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uplouds"),
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  const imgtype = file.mimetype.split("/")[0];
  if (imgtype === "image") {
    cb(null, true);
  } else {
    cb(new Error("File must be an image"), false);
  }
};
module.exports.upload = multer({ storage, fileFilter });



// const storagecourse = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, ""),
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split("/")[1];
//     const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//     cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
//   },
// });
// const fileFiltercourse = (req, file, cb) => {
//   const imgtype = file.mimetype.split("/")[0];
//   if (imgtype === "image") {
//     cb(null, true);
//   } else {
//     cb(new Error("File must be an image"), false);
//   }
// };
// module.exports.courseimg = multer({storage: storagecourse,fileFilter: fileFiltercourse,});
