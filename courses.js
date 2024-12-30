require("dotenv").config(); //عشان يعرف يو ار ال الي في دوت انف
const cors = require("cors");
const path = require("path");
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
const reviews = require("./models/reviews.model");
const users = require("./models/users.model");
const allowTo = require("./middleware/allow-to");
app.use(express.json());
app.use(cors());
app.use((re, res, next) => {
  next();
});
const { courseimg } = require("./middleware/handle-imges");
app.use("/coursesimg",express.static(path.join(__dirname, "coursesimg"))); // عرض الصور الثابتة
app.get("/", async (req, res) => {
  try {
    const query = req.query;
    const limit = parseInt(query.limit) || 2; // Convert limit to a number
    const page = parseInt(query.page) || 1; // Convert page to a number
    const skip = (page - 1) * limit;
    const totalCount = await courses.countDocuments();
    const course = await courses.find({}, { __v: 0 }).skip(skip).limit(limit);
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
app.post("/add",courseimg.single("imgcourse"),verfiytoken,allowTo(userroles.ADMIN, userroles.MANGER),async (req, res) => {
    try {
    const {title ,description, price ,isPublished,author,status,category}=req.body;
    const  imgcourse= req.file? req.file.filename: "no-photo-available-icon-20.jpg";
        const newcourse = await courses.create({
           title:title ,
           description:description ,
           price:price ,
           isPublished:isPublished ,
           author:author ,
           status:status ,
           category:category ,
           imgcourse:imgcourse ,
          });
      res
        .status(201)
        .json({ status: httpconstent.SUCCESS, data: { newcourse } });
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({
        status: httpconstent.ERROR,
        data: null,
        message: "invalid code",
        status: 500,
      });
    }
  }
);
app.patch("/update/:id",verfiytoken,allowTo(userroles.ADMIN, userroles.MANGER),async (req, res) => {
    const id = req.params.id;
    await courses.findByIdAndUpdate(id, { $set: { ...req.body } });
    let newcourse = await courses.findById(id);
    res.status(200).json({ status: httpconstent.SUCCESS, data: { newcourse } });
  }
);
app.delete("/delete/:id",verfiytoken,allowTo(userroles.ADMIN, userroles.MANGER),async (req, res) => {
    const id = req.params.id;
    await courses.deleteOne({ _id: id });
    //onther way
    // await courses.findOneAndDelete({_id:id});
    res.status(200).json({ status: httpconstent.SUCCESS, data: null });
  }
);

app.get("/search", async (req, res) => {
  try {
    const query = req.query;
    const search = query.q;
    if (!search || typeof search !== "string") {
      return res.status(400).json({
        status: 400,
        message:
          "Invalid request. 'search_coursesname' query parameter is required and must be a string.",
      });
    }
    const coursesList = await courses.find({
      title: { $regex: search, $options: "i" },
    });
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
app.get("/category/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const coursesList = await courses.find({ category: category });
    if (!coursesList || coursesList.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "No courses found matching the category.",
      });
    } else {
      return res.json({
        status: 200,
        data: {
          courses: coursesList,
        },
      });
    }
  } catch (error) {
    return res.json(error);
  }
});

//last-courses
app.get("/last-courses", async (req, res) => {
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

//reviews
app.post("/:courses_id/reviews", verfiytoken, async (req, res) => {
  const courseId = String(req.params.courses_id);
  try {
    // Validate request body
    const { rating, comment, userId } = req.body;
    if ((!rating || !comment, !userId)) {
      return res.status(400).json({
        status: 400,
        message: "Rating and comment are required fields.",
      });
    }

    // Create and save the review
    const review = new reviews({
      courseId,
      userId: req.body.userId,
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
app.get("/:courses_id/reviews", async (req, res) => {
  const courseId = req.params.courses_id;
  try {
    const reviewsList = await reviews
      .find({ courseId: courseId })
      .sort({ createdAt: -1 })
      .limit(10);
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
    const user = await users.findByIdAndUpdate(
      userId,
      {
        $addToSet: { favorites: courseId },
      },
      { new: true }
    );
    // const user = await users.findByIdAndUpdate(
    //  userId,
    //   { $push: { favorites: courseId } },
    //   { new: true }
    // );
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
  const userId = req.user.id
  try {
    // Find the user and select only the `favorites` field
    const user = await users.findById(userId, { favorites: 1 });
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    // Fetch details of courses in the `favorites` field
    const favoriteCourses = await courses.find(
      { _id: { $in: user.favorites } }, // Match course IDs in the `favorites` array
      { _id: 1, title: 1, price: 1 } // Select only the required fields
    );
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
app.delete("/delete/favorites/:courseId",verfiytoken,async (req, res) => {
    const { courseId } = req.params;
    const userId=req.user.id
    try {
      const user = await users.findById(userId, { favorites: 1 });
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
      await users.updateOne(
        { _id: userId },
        { $pull: { favorites: courseId } }
      );
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
  }
);
module.exports = app;
