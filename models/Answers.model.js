const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz", // الإشارة إلى نموذج الكويز
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Login", // الإشارة إلى نموذج المستخدم
      required: true,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
      },
    ],
    score: {
      type: Number, // عدد الإجابات الصحيحة
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Answer", answerSchema);
