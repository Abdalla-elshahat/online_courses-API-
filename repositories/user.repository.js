const User = require("../models/users.model");

// fields never returned to clients
const PRIVATE_FIELDS = { __v: false, password: false, tokenVersion: false, token: false };
// what other users may see about someone
const PROFILE_FIELDS = { ...PRIVATE_FIELDS, email: false, followRequests: false, favorites: false };

const findAllPublic = () => User.find({}, PRIVATE_FIELDS);

// the account owner's own data
const findPublicById = (id) => User.findById(id, PRIVATE_FIELDS);

// another user's profile
const findProfileById = (id) => User.findById(id, PROFILE_FIELDS);

const findById = (id, projection) => User.findById(id, projection);

// case-insensitive, so accounts saved with mixed-case emails still match
const findByEmail = (email) => User.findOne({ email }).collation({ locale: "en", strength: 2 });

const create = (data) => User.create(data);

// always strips private fields from the returned document
const updateById = (id, update, options = {}) =>
  User.findByIdAndUpdate(id, update, { new: true, ...options, projection: PRIVATE_FIELDS });

const updateOne = (filter, update) => User.updateOne(filter, update);

const updateMany = (filter, update) => User.updateMany(filter, update);

const deleteById = (id) => User.findByIdAndDelete(id);

const findFollowRequestIds = (id) => User.findById(id).select("followRequests").lean();

const findSummariesByIds = (ids) =>
  User.find({ _id: { $in: ids } }).select("_id username avatar").lean();

const hasFollowRequestFrom = (userId, requesterId) =>
  User.findOne({ _id: userId, followRequests: { $in: [requesterId] } });

const hasFollower = (userId, followerId) =>
  User.findOne({ _id: userId, followers: { $in: [followerId] } });

const findProfilesExcluding = (excludedIds) =>
  User.find({ _id: { $nin: excludedIds } }, PROFILE_FIELDS);

const findProfilesFollowing = (userId) => User.find({ followers: { $in: [userId] } }, PROFILE_FIELDS);

// removes a deleted user from everyone's follower / request lists
const removeFromFollowLists = (id) =>
  User.updateMany({}, { $pull: { followers: id, followRequests: id } });

module.exports = {
  findAllPublic,
  findPublicById,
  findProfileById,
  findById,
  findByEmail,
  create,
  updateById,
  updateOne,
  updateMany,
  deleteById,
  findFollowRequestIds,
  findSummariesByIds,
  hasFollowRequestFrom,
  hasFollower,
  findProfilesExcluding,
  findProfilesFollowing,
  removeFromFollowLists,
};
