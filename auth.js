require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const path = require("path");
const app = express.Router();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.url)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

const logins = require("./models/users.model");
const generateJWT = require("./generateJWT");
const verfiytoken = require("./verfiytoken");
const sendEmail = require("./nodemailer");
const { upload } = require("./middleware/handle-imges");
const userroles = require("./utles/Role-users");
const allowTo = require("./middleware/allow-to");

app.use("/uplouds", express.static(path.join(__dirname, "uplouds"))); // عرض الصور الثابتة

app.get("/", verfiytoken, async (req, res) => {
  try {
    const data = await logins.find({}, { __v: false, password: false });
    res.json(data);
  } catch (error) {
    console.error("Error fetching users:", error);
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
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
});
//update data
app.patch("/update_data", verfiytoken, async (req, res) => {
  const { username, avatar, job, socialmedia, country } = req.body;
  if (!username && !avatar && !job && !socialmedia && !country) {
    return res.status(400).json({
      status: 400,
      message:
        "At least one field (username, avatar, job, or socialmedia) must be provided for update",
    });
  }
  try {
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (job !== undefined) updateData.job = job;
    if (socialmedia !== undefined) updateData.socialmedia = socialmedia;
    if (country !== undefined) updateData.country = country;
    const updatedUser = await logins.findByIdAndUpdate(
      req.user.id,
      { $set: updateData }, // Only update provided fields
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
      message: "User updated successfully",
      data: updatedUser,
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
app.patch(
  "/users-role/:user_id",
  verfiytoken,
  allowTo(userroles.ADMIN, userroles.MANGER),
  async (req, res) => {
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
app.patch("/update_pass/:user_id", verfiytoken, async (req, res) => {
  const { user_id } = req.params;
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
app.patch("/sendfollow", verfiytoken, async (req, res) => {
  const  user_id  = req.user.id;
  const { follow_id } = req.body;
  const follow = await logins.findById(follow_id);
  if (!follow) {
    return res.status(404).json({ message: "User not found" });
  }
  const followUser = await logins.findOne({
    $and: [{ _id: user_id },{ followers: { $in: [follow_id] }}],
  });
  if (followUser) {
    return res
      .status(400)
      .json({ message: "You are already following this user" });
  }
  const updatedUser = await logins.findByIdAndUpdate(
user_id,
    {
      $push: { followers: follow_id },
    },
    { new: true,runValidators: true  }
  );
  return res.status(200).json({
    status: 200,
    message: "Followed successfully",
    data: {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      followers: updatedUser.followers,
    },
  });
});
//removefollow
app.patch("/removefollow", verfiytoken, async (req, res) => {
  const  user_id  = req.user.id;
  const { follow_id } = req.body;
  const follow = await logins.findById(follow_id);
  if (!follow) {
    return res.status(404).json({ message: "User not found" });
  }
  const followUser = await logins.findOne({
    $and: [{ _id: user_id },{ followers: { $in: [follow_id] }}],
  });
  if (!followUser) {
    return res
      .status(400)
      .json({ message: "You are already not following this user" });
  }
  const updatedUser = await logins.findByIdAndUpdate(
user_id,
    {
      $pull: { followers: follow_id },
    },
    { new: true,runValidators: true  }
  );
  return res.status(200).json({
    status: 200,
    message: "unFollowed successfully",
    data: {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      followers: updatedUser.followers,
    },
  });
});

app.post("/logout", (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "An error occurred during logout" });
  }
});

module.exports = app;
