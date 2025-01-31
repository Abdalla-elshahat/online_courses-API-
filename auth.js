require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const app = express.Router();
const cookieParser = require("cookie-parser");
const logins = require("./models/users.model");
const generateJWT = require("./generateJWT");
const verfiytoken = require("./verfiytoken");
const sendEmail = require("./nodemailer");
const  {upload } = require("./middleware/handle-imges");
const userroles = require("./utles/Role-users");
const allowTo = require("./middleware/allow-to");
const jwt = require("jsonwebtoken");
app.use(cors());
app.use(express.json());
app.use(cookieParser());
mongoose.connect(process.env.url)
  .then(() => console.log("connected to database"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));
function verifyJWT(token) {
  try {
    return jwt.verify(token, process.env.jwtsecret);
  } catch (error) {
    return null; // إذا كان التوكن غير صالح أو منتهي
  }
}
app.get("/", verfiytoken, async (req, res) => {
  try {
    const data = await logins.find({}, { __v: false, password: false });
    res.json(data);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "An error occurred", error });
  }
});
app.get("/alldata", verfiytoken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await logins.findById(userId, { __v: false, password: false });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "An error occurred", error });
  }
});
app.get("/dataofuser/:id", verfiytoken, async (req, res) => {
  try {
    const {id}= req.params;
    const user = await logins.findById(id, { __v: false, password: false });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "An error occurred", error });
  }
});
app.post("/signup", upload.single("avatar"), async (req, res) => {
  try {
    const { username, email, password, role, jop, socialmedia } = req.body;
    const existingUser = await logins.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    // try {
    //   const verificationLink = `/api/users/signup/${email}`;
    //   const text = `✨ مرحبًا ${username}! ✨\n\nيرجى الضغط على الرابط التالي لتفعيل بريدك الإلكتروني:\n\n🔗 ${verificationLink}\n\n🌟 شكراً لانضمامك إلينا! 🌟`;

    //   await sendEmail({
    //     email: email,
    //     subject: `✅ تحقق من بريدك الإلكتروني (متاح لمدة 10 دقائق)`,
    //     text,
    //   });

    //   res.status(200).json({
    //     status: "success",
    //     message: "🎉 تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح! 📩",
    //   });
    // } catch (err) {
    //   res.status(500).json({
    //     status: "fail",
    //     message: "❌ حدث خطأ أثناء إرسال رمز التحقق. الرجاء المحاولة لاحقاً.",
    //     error: err.message,
    //   });
    // }
    const avatar = req.file
      ? req.file.filename
      : "no-photo-available-icon-20.jpg";
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await logins.create({
      username,
      email,
      password: hashedPassword,
      role,
      avatar,
      jop,
      socialmedia,
    });

    const token = generateJWT({
      email: newUser.email,
      id: newUser._id,
      role: newUser.role,
    });
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        token,
        role: newUser.role,
        avatar: newUser.avatar,
        jop: newUser.jop,
        socialmedia: newUser.socialmedia,
      },
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "An error occurred", error });
  }
});
app.post("/login", async (req, res) => {
  try {
    if (req.cookies.token) {
      const decoded = verifyJWT(req.cookies.token); // دالة للتحقق من صحة التوكن
      if (decoded) {
        return res.status(400).json({ message: "You are already logged in" ,token:req.cookies.token});
      }
    }
    const { email, password } = req.body;
    const user = await logins.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = generateJWT({
      id: user._id,
      email: user.email,
      role: user.role,
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ message: "Login successful", token: token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
});
//update data
app.patch("/update_data", verfiytoken, upload.single("avatar"), async (req, res) => {
  const { username, job, socialmedia, country, description,skills } = req.body;

  if (!username && !req.file && !socialmedia && !country && !description&& !skills) {
    return res.status(400).json({
      status: 400,
      message: "At least one field (username, avatar, job, socialmedia, country, or description) must be provided for update",
    });
  }
  try {
    const updateData = {};
    if (req.file) {
      updateData.avatar = req.file.filename;
    }
    if (username !== undefined) updateData.username = username;
    if (job !== undefined) updateData.job = job;
    if (socialmedia !== undefined) updateData.socialmedia = socialmedia;
    if (country !== undefined) updateData.country = country;
    if (description !== undefined) updateData.description = description;
    if (skills !== undefined) updateData.skills = skills;
    const updatedUser = await logins.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }
    return res.status(200).json({
      status: 200,
      message: "User updated successfully",
      data:{
        updatedUser,
      } 
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Failed to update user",
      error: error.message,
    });
  }
});
//delete email //مسح الحساب
app.delete("/delete_data", verfiytoken, async (req, res) => {
  try {
    const deletedUser = await logins.findByIdAndDelete(req.user.id);
    if (!deletedUser) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }
    return res.status(200).json({
      status: 200,
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Failed to delete user",
      error: error.message,
    });
  }
});
//update role
app.patch("/users-role/:user_id",verfiytoken,allowTo(userroles.ADMIN, userroles.MANGER),async (req, res) => {
    const { user_id } = req.params;
    const { role } = req.body;
    try {
      const updatedUser = await logins.findByIdAndUpdate(
        user_id,
        { $set: { role } }, // Update only the provided fields
        { new: true, runValidators: true } // Return the updated document and validate
      );
      if (!updatedUser) {
        return res.status(404).json({
          status: 404,
          message: "User not found",
        });
      }
      return res.status(200).json({
        status: 200,
        message: "User updated role successfully",
        data: updatedUser,
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Failed to update role",
        error: error.message,
      });
    }
  }
);
//update pass
app.patch("/update_pass", verfiytoken, async (req, res) => {
  const  user_id  = req.user.id;
  const { old_pass, new_pass, confirm_pass } = req.body;
  try {
    const user = await logins.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isValidPassword = await bcrypt.compare(old_pass, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "The old password is incorrect" });
    }
    if (new_pass !== confirm_pass) {
      return res.status(400).json({
        message: "The new password and confirmation password do not match",
      });
    }
    const hashedPassword = await bcrypt.hash(new_pass, 10);
    const updatedUser = await logins.findByIdAndUpdate(
      user_id,
      { $set: { password: hashedPassword } },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }
    return res.status(200).json({
      status: 200,
      message: "Password updated successfully",
      data: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({
      status: 500,
      message: "Failed to update password",
      error: error.message,
    });
  }
});



//sendfollow
app.post("/sendfollow", verfiytoken, async (req, res) => {
  const user_id = req.user.id; // المستخدم الذي يرسل الطلب
  const { follow_id } = req.body; // المستخدم الذي يتم إرسال الطلب إليه

  const follow = await logins.findById(follow_id);
  if (!follow) {
    return res.status(404).json({ message: "User not found" });
  }

  // التحقق من وجود طلب متابعة معلق
  const pendingRequest = follow.followRequests?.find((req) => req === user_id);
  if (pendingRequest) {

    return res.status(400).json({ message: "Follow request already sent" });
  }

  // التحقق من أن المستخدم متابع بالفعل
  const isFollowing = follow.followers?.includes(user_id);
  if (isFollowing) {
    return res.status(400).json({ message: "You are already following this user" });
  }
  // إضافة طلب متابعة معلق
  await logins.findByIdAndUpdate(
    follow_id,
    { $push: { followRequests:user_id } },
    { new: true, runValidators: true }
  );

  return res.status(200).json({
    status: 200,
    message: "Follow request sent successfully",
  });
});
//accept follow or no
app.patch("/handlefollowrequest", verfiytoken, async (req, res) => {
  const user_id = req.user.id; // المستخدم الذي يقبل أو يرفض الطلب
  const { requester_id, action } = req.body; // `action` يمكن أن تكون "accept" أو "reject"
  const user = await logins.findById(user_id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  // التحقق من وجود الطلب
  const requestIndex = user.followRequests.indexOf(requester_id);
  if (requestIndex === -1) {
    return res.status(400).json({ message: "Follow request not found" });
  }

  if (action === "accept") {
    // قبول الطلب: إضافة المتابع إلى قائمة المتابعين
    await logins.findByIdAndUpdate(
      user_id,
      {
        $push: { followers: requester_id },
        $pull: { followRequests: requester_id },
      },
      { new: true, runValidators: true }
    );
    await logins.findByIdAndUpdate(
      requester_id,
      {
        $push: { followers:user_id },
      },
      { new: true, runValidators: true }
    );
    return res.status(200).json({ message: "Follow request accepted" });
  } else if (action === "reject") {
    // رفض الطلب: إزالة الطلب من قائمة طلبات المتابعة
    await logins.findByIdAndUpdate(
      user_id,
      { $pull: { followRequests: requester_id } },
      { new: true, runValidators: true }
    );
    return res.status(200).json({ message: "Follow request rejected" });
  } else {
    return res.status(400).json({ message: "Invalid action" });
  }
});
//remove follow
app.patch("/removefollow", verfiytoken, async (req, res) => {
  const user_id = req.user.id;
  const { follow_id } = req.body; 
  try {
    const follow = await logins.findById(follow_id);
    if (!follow) {
      return res.status(404).json({ message: "User not found" });
    }
    const pendingRequest = await logins.findOne({
      $and: [
        { _id: follow_id },
        { followRequests: { $in: [user_id] } }, // Check if in the pendingFollowers array
      ],
    });

    if (pendingRequest) {
      // Remove from `pendingFollowers` if it is pending
      await logins.findByIdAndUpdate(follow_id, {
        $pull: { followRequests: user_id },
      });
      return res.status(200).json({
        status: 200,
        message: "Follow request removed successfully",
      });
    }

    // Check if the `follow_id` is already in the user's followers
    const followUser = await logins.findOne({
      $and: [{ _id: user_id }, { followers: { $in: [follow_id] } }],
    });

    if (!followUser) {
      return res.status(400).json({
        message: "You are already not following this user or no follow relationship exists",
      });
    }

    // Remove from both users' followers lists
    await logins.findByIdAndUpdate(user_id, {
      $pull: { followers: follow_id },
    });

    await logins.findByIdAndUpdate(follow_id, {
      $pull: { followers: user_id },
    });

    return res.status(200).json({
      status: 200,
      message: "Unfollowed successfully",
    });
  } catch (error) {
    console.error("Error processing unfollow:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
//get followers
app.get("/received-notifications", verfiytoken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await logins.findById(userId).select("followRequests").lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.followRequests || user.followRequests.length === 0) {
      return res.status(200).json({
        message: "No follow requests received",
        requests: [],
      });
    }
    const followRequests = await logins
      .find({ _id: { $in: user.followRequests } })
      .select("_id username email avatar") 
      .lean();
    return res.status(200).json({
      message: "Follow requests retrieved successfully",
      requests: followRequests,
    });
  } catch (error) {
    console.error("Error fetching received notifications:", error);
    return res.status(500).json({
      message: "An error occurred while fetching notifications",
    });
  }
});
//get all users is not followers
app.get("/non-followers", verfiytoken, async (req, res) => {
  try {
    const userId = req.user.id; // استخراج الـ ID الخاص بالمستخدم من الـ token
    const currentUser = await logins.findById(userId);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // جلب جميع المستخدمين الذين ليسوا في قائمة المتابعين
    const nonFollowers = await logins.find(
      {
        _id: { $nin: [...currentUser.followers, userId] }, // استبعاد المتابعين والمستخدم الحالي
      },
      { __v: false, password: false } // استبعاد بعض الحقول من النتائج
    );

    res.json(nonFollowers);
  } catch (error) {
    console.error("Error fetching non-followers:", error);
    res.status(500).json({ message: "An error occurred", error });
  }
});
// Get all followers who follow the current user
app.get("/followers", verfiytoken, async (req, res) => {
  try {
    const userId = req.user.id; // استخراج الـ ID الخاص بالمستخدم من الـ token
    const currentUser = await logins.findById(userId);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // جلب جميع المستخدمين الذين قاموا بمتابعة المستخدم الحالي
    const followers = await logins.find(
      {
        followers: { $in: [userId] }, // جلب جميع المستخدمين الذين يتضمنون الـ userId في قائمة المتابعين
      },
      { __v: false, password: false } // استبعاد بعض الحقول من النتائج
    );

    res.json(followers);
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).json({ message: "An error occurred", error });
  }
});
app.post("/logout", (req, res) => {
  try {
    if (!req.cookies.token) {
      return res.status(400).json({ message: "No token found in cookies" });
    }

    // Clear the token cookie
    res.clearCookie("token", { httpOnly: true, secure: true }); // Ensure secure cookie handling in production
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "An error occurred during logout" });
  }
});
module.exports = app;