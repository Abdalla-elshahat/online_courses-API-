const mongoose = require("mongoose");

// Define the answer schema
const answerSchema = new mongoose.Schema({
  text: {
    type: String,
  },
  isCorrect: {
    type: Boolean,
    default: false, // لتحديد إذا كانت الإجابة صحيحة
  },
});

// Define the question schema
const questionSchema = new mongoose.Schema({
  text: {
    type: String,
  },
  answers: {
    type: [answerSchema], // قائمة بالإجابات
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "easy", // مستوى الصعوبة
  },
});

// Define the quiz schema
const quizSchema = new mongoose.Schema({
  courseId: {type: mongoose.Schema.Types.ObjectId,ref: "Course",required: false},
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required:false },
  title: {
    type: String,
  },
  questions: {
    type: [questionSchema], // قائمة بالأسئلة
  },
  author: {
    type: String,
  },
  category: {
    type: String,
    enum: ["web development", "data science", "machine learning", "mobileApp"],
    default: "web development", // التصنيف
  },
  createdAt: {
    type: Date,
    default: Date.now, // تاريخ الإنشاء
  },
  isPublished: {
    type: Boolean,
    default: false, // حالة النشر
  },
  timeLimit: {
    type: Number, // الحد الزمني للإجابة عن الكويز
    default: 600, // القيمة الافتراضية 10 دقائق (بالثواني)
  },
});

module.exports = mongoose.model("quiz", quizSchema);
