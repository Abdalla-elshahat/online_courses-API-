require("dotenv").config(); //عشان يعرف يو ار ال الي في دوت انف
const cors = require("cors");
const httpconstent = require("./utles/httpconstent");
const userroles = require("./utles/Role-users");
const verfiytoken = require("./verfiytoken");
const express = require("express");
const app = express.Router();
const mongoose = require("mongoose");
const url = process.env.url;
mongoose.connect(url).then(() => {
  console.log("connected to database");
});
const courses = require("./models/courses.model");
const logins = require("./models/users.model");
const reviews = require("./models/reviews.model");
const allowTo = require("./middleware/allow-to");
const Quiz=require("./models/quiz.model");
const Answers = require("./models/Answers.model");
app.use(express.json());
app.use(cors());
app.use((re, res, next) => {
  next();
});
  // Get all quizzes
  app.get("/quizzes",verfiytoken, async (req, res) => {
    try {
      const quizzes = await Quiz.find();
      res.status(200).json(quizzes);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
// Get all quizzes added by (admin and manger) the logged-in user
app.get("/myquizzes", verfiytoken, allowTo(userroles.ADMIN, userroles.MANGER), async (req, res) => {
  const userId = req.user.id; 
  try {
    const user = await logins.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (!user.quiz || user.quiz.length === 0) {
      return res
        .status(404)
        .json({ message: "No courses found for this user." });
    }
    const quizIds = user.quiz.map((quiz) =>
      typeof quiz === "object" && quiz.toString ? quiz.toString() : String(quiz)
    );

    const quizList = await Quiz.find({ _id: { $in: quizIds } })

    // الرد مع البيانات
    res.status(200).json({
      status: "success",
      data: {
        quiz: quizList, // الكورسات المرتبطة بالمستخدم
      },
    });
  } catch (error) {
    console.error("Error fetching courses by posts:", error.message);
    res.status(500).json({
      message: "Internal server error",
      error: error.message, // عرض الخطأ للمساعدة في تصحيحه
    });
  }
});
// Create a new quiz
app.post("/quizzes/:course_id",verfiytoken,allowTo(userroles.ADMIN, userroles.MANGER), async (req, res) => {
  const userId=req.user.id;
  const {course_id}=req.params;
    try {
      const quiz = new Quiz({ ...req.body, courseId: course_id });
      await quiz.save();
      //بيضيف الكويز لي اليوزر الي يخص
      await logins.findByIdAndUpdate(userId,
              { $push: { quiz:quiz._id } },
              { new: true });
 //بيضيف الكويز لي الكورس الي يخص
                await courses.findByIdAndUpdate(course_id,
                { $push: { quiz:quiz._id } },
                { new: true });
      res.status(201).json({
        message: "Quiz created successfully",
          quiz, 
          courseId:course_id
      }
      );
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  // Get a quiz by ID
  app.get("/quizzes/:quizId",verfiytoken, async (req, res) => {
    const {quizId} = req.params;
    try {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.status(200).json(quiz);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
// Get all quizzes by courseID
app.get("/quizzes/course/:courseId", verfiytoken, async (req, res) => {
  const { courseId } = req.params;
  try {
    // البحث عن الكويزات التي لها courseId يطابق الكورس المطلوب
    const quizzes = await Quiz.find({ courseId: courseId });

    if (!quizzes || quizzes.length === 0) {
      return res.status(404).json({ message: "No quizzes found for this course" });
    }

    res.status(200).json({
      status: "success",
      results: quizzes.length,
      data: quizzes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
  // Update a quiz by ID
  app.put("/quizzes/:quizId",verfiytoken,allowTo(userroles.ADMIN, userroles.MANGER), async (req, res) => {
    const user_ID=req.user.id;
    const {quizId} = req.params;
    if(!user_ID){
      return res.status(401).json({ message: "You are not logged in" });
    }
    try {
      const quiz = await Quiz.findByIdAndUpdate(quizId, req.body, {
        new: true,
        runValidators: true,
      });
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.status(200).json(quiz);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  // Delete a quiz by ID
  app.delete("/quizzes/:quizId",verfiytoken,allowTo(userroles.ADMIN, userroles.MANGER), async (req, res) => {
      const userId = req.user.id;
      const { quizId } = req.params;
      try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
          return res.status(404).json({ message: "Quiz not found" });
        }
        await logins.findByIdAndUpdate(userId,
          { $pull: { quiz:quiz._id } },
          { new: true });
          await courses.findByIdAndUpdate(quiz.courseId,
          { $pull: { quiz:quiz._id } },
          { new: true });
        await Quiz.findByIdAndDelete(quizId);
  
        res.status(200).json({
          message: "Quiz deleted successfully",
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );



//answers
app.post("/quizzes/:quizId/answers", verfiytoken, async (req, res) => {
  const userId = req.user.id;
  const { quizId } = req.params;
  const { answers } = req.body;
  try {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
          return res.status(404).json({ message: "Quiz not found" });
      }
      let score = 0;
      const userAnswers = [];
      answers.forEach((userAnswer) => {
          const question = quiz.questions.find(q => q._id.toString() === userAnswer.questionId);
          if (question) {
              const correctAnswer = question.answers.find(ans => ans.isCorrect);
              if (correctAnswer && correctAnswer.text === userAnswer.answer) {
                  score++;
              }
              userAnswers.push({
                  questionId: userAnswer.questionId,
                  answer: userAnswer.answer,
              });
          }
      });
      const answer = new Answers({
          quizId,
          userId,
          answers: userAnswers,
          score,
      });
      await answer.save();

      res.status(201).json({
          message: "Answers submitted successfully",
          score,
          data: answer,
      });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});
  app.get("/myanswers", verfiytoken, async (req, res) => {
    const userId = req.user.id;
    try {
      const answers = await Answers.find({ userId }).populate("quizId", "title"); // جلب الكويزات المرتبطة
      if (!answers || answers.length === 0) {
        return res.status(404).json({ message: "No answers found for this user" });
      }
  
      res.status(200).json({
        status: "success",
        data: answers,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app.get("/quizzes/:quizId/answers", verfiytoken, async (req, res) => {
    const { quizId } = req.params;
  
    try {
      // البحث عن الإجابات المرتبطة بالكويز مع جلب أسماء المستخدمين
      const answers = await Answers.find({ quizId })
        .populate({
          path: "userId", // الحقل المرتبط بالمستخدمين
          select: "username email", // تحديد الحقول المطلوبة من نموذج Login
        });
  
      if (!answers || answers.length === 0) {
        return res.status(404).json({ message: "No answers found for this quiz" });
      }
  
      res.status(200).json({
        status: "success",
        data: answers,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  // scores
  app.get("/quizzes/:quizId/score", verfiytoken, async (req, res) => {
    const userId = req.user.id;
    const { quizId } = req.params;
    try {
        const answer = await Answers.findOne({ quizId, userId });
        if (!answer) {
            return res.status(404).json({ message: "No score found for this quiz" });
        }
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }
        res.status(200).json({
            status: "success",
            quizId,
            userId,
            score: answer.score,
            totalquestion: quiz.questions.length,  // إجمالي عدد الأسئلة
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

  

  module.exports = app;




