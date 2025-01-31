const mongoose = require("mongoose");

// Define Review Schema
const ReviewSchema = new mongoose.Schema({
  courseId: {type: mongoose.Schema.Types.ObjectId,ref: "Course",required: true,},
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 10 },
  comment: { type: String, required: true, maxlength: 500 },
  username: { type: String, required: true }, // اسم المستخدم
  avatar: { type: String, required: true }, // صورة المستخدم
  createdAt: { type: Date, default: Date.now }

});

// Create Review Model
module.exports = mongoose.model("Review", ReviewSchema);

