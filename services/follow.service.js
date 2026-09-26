const userRepository = require("../repositories/user.repository");
const { AppError } = require("../utles/app-error");
const { requireObjectId } = require("../utles/validate");

const userNotFound = () => new AppError(404, { message: "User not found" });

// userId sends a follow request to followId
const sendFollowRequest = async (userId, followId) => {
  requireObjectId(followId, "follow_id");
  if (followId === userId) {
    throw new AppError(400, { message: "You cannot follow yourself" });
  }
  const target = await userRepository.findById(followId);
  if (!target) throw userNotFound();

  if (target.followRequests?.includes(userId)) {
    throw new AppError(400, { message: "Follow request already sent" });
  }
  if (target.followers?.includes(userId)) {
    throw new AppError(400, { message: "You are already following this user" });
  }

  await userRepository.updateById(
    followId,
    { $addToSet: { followRequests: userId } },
    { new: true, runValidators: true }
  );
};

// returns the response message for the chosen action ("accept" | "reject")
const handleFollowRequest = async (userId, requesterId, action) => {
  requireObjectId(requesterId, "requester_id");
  const user = await userRepository.findById(userId);
  if (!user) throw userNotFound();

  if (!(user.followRequests || []).includes(requesterId)) {
    throw new AppError(400, { message: "Follow request not found" });
  }

  if (action === "accept") {
    await userRepository.updateById(
      userId,
      { $addToSet: { followers: requesterId }, $pull: { followRequests: requesterId } },
      { new: true, runValidators: true }
    );
    await userRepository.updateById(
      requesterId,
      { $addToSet: { followers: userId } },
      { new: true, runValidators: true }
    );
    return "Follow request accepted";
  }

  if (action === "reject") {
    await userRepository.updateById(
      userId,
      { $pull: { followRequests: requesterId } },
      { new: true, runValidators: true }
    );
    return "Follow request rejected";
  }

  throw new AppError(400, { message: "Invalid action" });
};

// cancels a pending request or unfollows; returns the response message
const removeFollow = async (userId, followId) => {
  requireObjectId(followId, "follow_id");
  const target = await userRepository.findById(followId);
  if (!target) throw userNotFound();

  if (await userRepository.hasFollowRequestFrom(followId, userId)) {
    await userRepository.updateById(followId, { $pull: { followRequests: userId } });
    return "Follow request removed successfully";
  }

  if (!(await userRepository.hasFollower(userId, followId))) {
    throw new AppError(400, {
      message: "You are already not following this user or no follow relationship exists",
    });
  }

  await userRepository.updateById(userId, { $pull: { followers: followId } });
  await userRepository.updateById(followId, { $pull: { followers: userId } });
  return "Unfollowed successfully";
};

const getFollowRequests = async (userId) => {
  const user = await userRepository.findFollowRequestIds(userId);
  if (!user) throw userNotFound();

  if (!user.followRequests || user.followRequests.length === 0) return [];
  return userRepository.findSummariesByIds(user.followRequests);
};

const getNonFollowers = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw userNotFound();
  return userRepository.findProfilesExcluding([...(user.followers || []), userId]);
};

const getFollowers = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw userNotFound();
  return userRepository.findProfilesFollowing(userId);
};

module.exports = {
  sendFollowRequest,
  handleFollowRequest,
  removeFollow,
  getFollowRequests,
  getNonFollowers,
  getFollowers,
};
