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
app.use(express.json());
app.use(cors());
app.use((re, res, next) => {
  next();
});
const { upload } = require("./middleware/handle-imges");
//get search by name
app.get("/search", verfiytoken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({
        status: 400,
        message: "'q' query parameter is required and must be a non-empty string.",
      });
    }
    const coursesList = await courses.find({
      title: { $regex: q, $options: "i" }, 
    });
     console.log(coursesList)
    if (!coursesList || coursesList.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "No courses found matching the search criteria.",
      });
    }
    return res.json({
      status: 200,
      data: {
        courses: coursesList,
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error); // Log the error for debugging
    return res.status(500).json({
      status: 500,
      message: "An unexpected error occurred while fetching courses.",
      error: error.message,
    });
  }
});
app.get("/coursesiamadded", verfiytoken, allowTo(userroles.ADMIN, userroles.MANGER), async (req, res) => {
  const userId = req.user.id; 
  const sort = req.query.sort || 'title'; 
    const order = req.query.order === 'desc' ? -1 : 1;
  try {
    const user = await logins.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (!user.posts || user.posts.length === 0) {
      return res
        .status(404)
        .json({ message: "No courses found for this user." });
    }
    const postIds = user.posts.map((post) =>
      typeof post === "object" && post.toString ? post.toString() : String(post)
    );
    const coursesList = await courses.find({ _id: { $in: postIds } }).sort({[sort]:order});

    // الرد مع البيانات
    res.status(200).json({
      status: "success",
      data: {
        courses: coursesList, // الكورسات المرتبطة بالمستخدم
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

app.get("/", async (req, res) => {
  try {
    const query = req.query;
    const category=req.query.category||"all"
    const sort = req.query.sort || 'title'; // default sort by title if no sort is provided
    const order = req.query.order === 'desc' ? -1 : 1; // default to ascending order
    const limit = parseInt(query.limit) || this.all; // Convert limit to a number
    const page = parseInt(query.page) || 1; // Convert page to a number
    const skip = (page - 1) * limit;
    const filter = category === "all" ? {} : { category };
    const totalCount = await courses.countDocuments(filter);
    const course = await courses.find(filter, { __v: 0 }).sort({ [sort]: order }).skip(skip).limit(limit);
    const totalPages = Math.ceil(totalCount / limit);
    return res.json({
      status: httpconstent.SUCCESS,
      data: {
        courses: course,
        pagination: {
          totalItems: totalCount,
          totalPages: totalPages,
          currentPage: page,
          limitPerPage: limit,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});
//last-courses
app.get("/last_courses",async (req, res) => {
  try {
    const coursesList = await courses.find().sort({ createdAt: -1 }).limit(10);
    return res.status(200).json({
      status: 200,
      data: {
        courses: coursesList,
      },
    });
  } catch (error) {
    return res.json(error);
  }
});
//courses
app.get("/:id", async (req, res) => {
  const course = await courses.findById(req.params.id);
  if (course) {
    res.status(200).json({ status: httpconstent.SUCCESS, data: { course } });
  } else {
    res.status(404).json({
      status: httpconstent.ERROR,
      data: null,
      message: "courses not found",
      status: 404,
    });
  }
});
app.post("/add",upload.single("imgcourse"),verfiytoken,allowTo(userroles.ADMIN, userroles.MANGER),async (req, res) => {
    const user_Id = req.user.id;
    try {
      const {title,description,price,isPublished,author,status,category} = req.body;
      const imgcourse = req.file? req.file.filename: "no-photo-available-icon-20.jpg";
      const newcourse = await courses.create({title: title,description: description,price: price,isPublished: isPublished,author: author,status: status,category: category,imgcourse: imgcourse,});
      // Update the user's posts with the new course ID
      const userUpdateResult = await logins.findByIdAndUpdate(
        user_Id,
        { $push: { posts: newcourse._id } },
        { new: true } // Return the updated document
      );
      if (!userUpdateResult) {
        return res.status(404).json({
          status: httpconstent.ERROR,
          data: null,
          message: "User not found",
        });
      }
      res.status(201).json({
        status: httpconstent.SUCCESS,
        data: { newcourse },
      });
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({
        status: httpconstent.ERROR,
        data: null,
        message: "An error occurred while creating the course",
      });
    }
  }
);
app.patch("/update/:id",upload.single("imgcourse"),verfiytoken,allowTo(userroles.ADMIN, userroles.MANGER),async (req, res) => {
    try {
  const coursid = req.params.id;
  const course = await courses.findById(coursid);
      if (!course) {
        return res.status(404).json({
          status: httpconstent.ERROR,
          message: "Course not found",
        });
      }
      const updateData = { ...req.body};
      if (req.file) {
        updateData.imgcourse = req.file.filename; // إضافة مسار الصورة إذا تم تحميلها
        
      }
      await courses.findByIdAndUpdate(coursid, { $set: updateData });
      const updatedCourse = await courses.findById(coursid);
    res.status(200).json({ status: httpconstent.SUCCESS, data: { updatedCourse } });
  }
  catch(error){
    console.error("Error updating course:", error);
  }
  });
app.delete("/delete/:id", verfiytoken, allowTo(userroles.ADMIN, userroles.MANGER), async (req, res) => {
    const id = req.params.id;
    const user_Id = req.user.id;
    try {
        const course = await courses.findOneAndDelete({ _id: id });
        if (course) {
            const userUpdateResult = await logins.findByIdAndUpdate(
                user_Id,
                { $pull: { posts: course._id } },
                { new: true }
            );
            if (userUpdateResult) {
                return res.status(200).json({
                    status: httpconstent.SUCCESS,
                    message: "Course deleted successfully",
                    data: userUpdateResult
                });
            } else {
                return res.status(400).json({
                    status: httpconstent.ERROR,
                    message: "User update failed",
                });
            }
        } else {
            // If the course was not found
            return res.status(404).json({
                status: httpconstent.ERROR,
                message: "Course not found",
            });
        }
    } catch (error) {
        console.error("Error deleting course:", error);
        return res.status(500).json({
            status: httpconstent.ERROR,
            message: "An error occurred while deleting the course.",
        });
    }
});


//reviews
app.post("/:courses_id/reviews", verfiytoken, async (req, res) => {
  const userId=req.user.id
  const courseId = String(req.params.courses_id);
  try {
    // Validate request body
    const { rating, comment} = req.body;
    if ((!rating || !comment)) {
      return res.status(400).json({
        status: 400,
        message: "Rating and comment are required fields.",
      });
    }
    const user = await logins.findById(userId); // تأكد أن لديك نموذج (Model) المستخدم
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found.",
      });
    }
    // Create and save the review
    const review = new reviews({
      courseId,
      userId,
      username: user.username, // اسم المستخدم من قاعدة البيانات
      avatar: user.avatar,
      rating: req.body.rating,
      comment: req.body.comment,
    });
    const result = await review.save();
    return res.status(201).json({
      status: 201,
      message: "Review added successfully",
      data: {
        review: result,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});
app.get("/:courses_id/reviews",verfiytoken, async (req, res) => {
  const courseId = req.params.courses_id;
  try {
    const reviewsList = await reviews.find({ courseId: courseId }).sort({ createdAt: -1 }).limit(10);
    return res.json({
      status: 200,
      data: {
        reviews: reviewsList,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});
app.patch("/:course_id/reviews/:review_id",verfiytoken, async (req, res) => {
  const { course_id, review_id } = req.params;
  const { rating, comment} = req.body;

  try {
    const updatedReview = await reviews.findOneAndUpdate(
      { _id: review_id, courseId: course_id },
      { $set: { rating: rating, comment: comment } },
      { new: true } // return the updated document
    );

    if (!updatedReview) {
      return res.status(404).json({
        status: 404,
        message: "Review not found",
      });
    }

    return res.json({
      status: 200,
      message: "Review updated successfully",
      data: updatedReview,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});
app.delete("/:course_id/reviews/:review_id",verfiytoken, async (req, res) => {
  const { course_id, review_id } = req.params;
  try {
    const deletedReview = await reviews.findOneAndDelete({_id: review_id,courseId: course_id});
    if (!deletedReview) {
      return res.status(404).json({
        status: 404,
        message: "Review not found",
      });
    }
    return res.json({
      status: 200,
      message: "Review deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

//change status
app.patch("/:courses_id/status",verfiytoken,allowTo(userroles.ADMIN, userroles.MANGER),async (req, res) => {
    const courseId = req.params.courses_id;
    const status = req.body.status;
    try {
      const course = await courses.findByIdAndUpdate(
        courseId,
        { status: status },
        { new: true }
      );
      if (!course) {
        return res.status(404).json({
          status: 404,
          message: "Course not found",
        });
      }
      return res.json({
        status: 200,
        message: "Course status updated successfully",
        data: { course: course },
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
);

//favorite-course
app.post("/add/favorites", verfiytoken, async (req, res) => {
  const userId = req.user.id;
  const courseId = req.body.courseId;
  try {
    const user = await logins.findByIdAndUpdate(
      userId,
      {
        $addToSet: { favorites: courseId },
      },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }
    return res.json({
      status: 200,
      message: "Course added to favourites successfully",
      data: {
        user: userId,
        course: courseId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});
app.get("/all/favorites", verfiytoken, async (req, res) => {
  const userId = req.user.id;
  try {
    // Find the user and select only the `favorites` field
    const user = await logins.findById(userId, { favorites: 1 });
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    // Fetch details of courses in the `favorites` field
    const favoriteCourses = await courses.find({ _id: { $in: user.favorites } });
    if (!favoriteCourses) {
      return res.status(404).json({
        status: 404,
        message: "No courses found in favourites",
      });
    }
    return res.status(200).json({
      status: 200,
      data: favoriteCourses.map((course) => ({
        id: course._id, // Convert `_id` to `id` for consistency
        title: course.title,
        price: course.price,
        description: course.description,
        isPublished: course.isPublished,
        author: course.author,
        status: course.status,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});
app.post("/delete/favorites", verfiytoken, async (req, res) => {
  const courseId = req.body.courseId;
  const userId = req.user.id;
  try {
    const user = await logins.findById(userId, { favorites: 1 });
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }
    if (!user.favorites || !user.favorites.includes(courseId)) {
      return res.status(404).json({
        status: 404,
        message: "Course not found in user's favorites",
      });
    }
    await logins.updateOne({ _id: userId }, { $pull: { favorites: courseId } });
    return res.status(200).json({
      status: 200,
      message: "Course removed from favorites successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});
module.exports = app;
