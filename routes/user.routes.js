const express = require("express");
const verifyToken = require("../middleware/verify-token");
const allowTo = require("../middleware/allow-to");
const { upload } = require("../middleware/handle-imges");
const userroles = require("../utles/Role-users");
const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");
const followController = require("../controllers/follow.controller");

const router = express.Router();

// auth
router.post("/signup", upload.single("avatar"), authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.patch("/update_pass", verifyToken, authController.updatePassword);

// users
router.get("/", verifyToken, userController.getAllUsers);
router.get("/alldata", verifyToken, userController.getMe);
router.get("/dataofuser/:id", verifyToken, userController.getUserById);
router.patch("/update_data", verifyToken, upload.single("avatar"), userController.updateProfile);
router.delete("/delete_data", verifyToken, userController.deleteAccount);
router.patch(
  "/users-role/:user_id",
  verifyToken,
  allowTo(userroles.ADMIN, userroles.MANGER),
  userController.updateRole
);

// follow
router.post("/sendfollow", verifyToken, followController.sendFollowRequest);
router.patch("/handlefollowrequest", verifyToken, followController.handleFollowRequest);
router.patch("/removefollow", verifyToken, followController.removeFollow);
router.get("/received-notifications", verifyToken, followController.getFollowRequests);
router.get("/non-followers", verifyToken, followController.getNonFollowers);
router.get("/followers", verifyToken, followController.getFollowers);

module.exports = router;
