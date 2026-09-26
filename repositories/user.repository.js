const User = require("../models/users.model");

// fields never returned to clients
const PUBLIC_FIELDS = { __v: false, password: false };

const findAllPublic = () => User.find({}, PUBLIC_FIELDS);

const findPublicById = (id) => User.findById(id, PUBLIC_FIELDS);

const findById = (id, projection) => User.findById(id, projection);

const findByEmail = (email) => User.findOne({ email });

const create = (data) => User.create(data);

const updateById = (id, update, options = { new: true }) =>
  User.findByIdAndUpdate(id, update, options);

const updateOne = (filter, update) => User.updateOne(filter, update);

const deleteById = (id) => User.findByIdAndDelete(id);

const findFollowRequestIds = (id) => User.findById(id).select("followRequests").lean();

const findSummariesByIds = (ids) =>
  User.find({ _id: { $in: ids } }).select("_id username email avatar").lean();

const hasFollowRequestFrom = (userId, requesterId) =>
  User.findOne({ _id: userId, followRequests: { $in: [requesterId] } });

const hasFollower = (userId, followerId) =>
  User.findOne({ _id: userId, followers: { $in: [followerId] } });

const findPublicExcluding = (excludedIds) =>
  User.find({ _id: { $nin: excludedIds } }, PUBLIC_FIELDS);

const findPublicFollowersOf = (userId) =>
  User.find({ followers: { $in: [userId] } }, PUBLIC_FIELDS);

module.exports = {
  findAllPublic,
  findPublicById,
  findById,
  findByEmail,
  create,
  updateById,
  updateOne,
  deleteById,
  findFollowRequestIds,
  findSummariesByIds,
  hasFollowRequestFrom,
  hasFollower,
  findPublicExcluding,
  findPublicFollowersOf,
};
