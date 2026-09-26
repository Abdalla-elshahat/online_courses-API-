const followService = require("../services/follow.service");
const { sendIfAppError } = require("../utles/app-error");

const sendFollowRequest = async (req, res) => {
  try {
    await followService.sendFollowRequest(req.user.id, req.body.follow_id);
    res.status(200).json({ status: 200, message: "Follow request sent successfully" });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error sending follow request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const handleFollowRequest = async (req, res) => {
  try {
    const { requester_id, action } = req.body;
    const message = await followService.handleFollowRequest(req.user.id, requester_id, action);
    res.status(200).json({ message });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error handling follow request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const removeFollow = async (req, res) => {
  try {
    const message = await followService.removeFollow(req.user.id, req.body.follow_id);
    res.status(200).json({ status: 200, message });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error processing unfollow:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getFollowRequests = async (req, res) => {
  try {
    const requests = await followService.getFollowRequests(req.user.id);
    res.status(200).json({
      message: requests.length
        ? "Follow requests retrieved successfully"
        : "No follow requests received",
      requests,
    });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error fetching received notifications:", error);
    res.status(500).json({ message: "An error occurred while fetching notifications" });
  }
};

const getNonFollowers = async (req, res) => {
  try {
    res.json(await followService.getNonFollowers(req.user.id));
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error fetching non-followers:", error);
    res.status(500).json({ message: "An error occurred" });
  }
};

const getFollowers = async (req, res) => {
  try {
    res.json(await followService.getFollowers(req.user.id));
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error fetching followers:", error);
    res.status(500).json({ message: "An error occurred" });
  }
};

module.exports = {
  sendFollowRequest,
  handleFollowRequest,
  removeFollow,
  getFollowRequests,
  getNonFollowers,
  getFollowers,
};
